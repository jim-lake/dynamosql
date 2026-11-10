import { setTimeout as sleepMs } from 'node:timers/promises';

import { logger } from '@dynamosql/shared';

import { SQLError } from '../error';
import { escapeString } from '../tools/dynamodb_helper';

import type { DynamoDBWithCache } from './dynamodb';
import type { EvaluationValue, LockRequest } from './expression';
import type { Session } from '../session';

export const LOCK_TABLE = '__dynamosql_locks';
export const LEASE_MS = 10_000;
export const RENEW_MS = 1_000;
const POLL_MS = 250;
const MAX_NAME_LENGTH = 64;

export interface HeldLease {
  count: number;
  timer: NodeJS.Timeout;
}

export function normalizeLockName(name: string): string {
  const lower = name.toLowerCase();
  if (lower === '' || Buffer.byteLength(lower) > MAX_NAME_LENGTH) {
    throw new SQLError({ code: 'ER_USER_LOCK_WRONG_NAME', args: [name] });
  }
  return lower;
}

async function ensureLockTable(dynamodb: DynamoDBWithCache): Promise<void> {
  try {
    await dynamodb.getTable(LOCK_TABLE);
    return;
  } catch (err) {
    if (!(err instanceof Error) || err.message !== 'resource_not_found') {
      throw err;
    }
  }
  try {
    await dynamodb.createTable({
      table: LOCK_TABLE,
      primary_key: [{ name: 'lock_key', type: 'S' }],
    });
  } catch (err) {
    if (!(err instanceof Error) || err.message !== 'resource_in_use') {
      throw err;
    }
  }
  for (;;) {
    const result = await dynamodb.getTable(LOCK_TABLE);
    if (result.Table?.TableStatus === 'ACTIVE') {
      return;
    }
    await sleepMs(POLL_MS);
  }
}

function isConditionFailure(err: unknown): boolean {
  return (
    (err as { name?: string } | null)?.name ===
    'ConditionalCheckFailedException'
  );
}

// Returns false when another owner holds an unexpired lease.
async function writeLease(session: Session, key: string): Promise<boolean> {
  const now = Date.now();
  try {
    await session.dynamodb.updateItem({
      table: LOCK_TABLE,
      key: { lock_key: { S: key } },
      expression: 'SET owner_id = :owner, expires_at = :expires',
      condition:
        'attribute_not_exists(owner_id) OR expires_at < :now OR owner_id = :owner',
      values: {
        ':owner': { S: session.lockOwner },
        ':expires': { N: String(now + LEASE_MS) },
        ':now': { N: String(now) },
      },
    });
    return true;
  } catch (err) {
    if (isConditionFailure(err)) {
      return false;
    }
    throw err;
  }
}

async function acquire(
  session: Session,
  name: string,
  timeout_s: number
): Promise<boolean> {
  await ensureLockTable(session.dynamodb);
  const key = `${session.transactionDomain}_${name}`;
  const deadline = Date.now() + timeout_s * 1000;
  for (;;) {
    if (await writeLease(session, key)) {
      _addHeld(session, key);
      return true;
    }
    if (Date.now() >= deadline) {
      return false;
    }
    await sleepMs(POLL_MS);
  }
}

function _addHeld(session: Session, key: string): void {
  const existing = session.heldLocks.get(key);
  if (existing) {
    existing.count++;
    return;
  }
  const timer = setInterval(() => {
    void _renew(session, key);
  }, RENEW_MS);
  timer.unref();
  session.heldLocks.set(key, { count: 1, timer });
}

async function _renew(session: Session, key: string): Promise<void> {
  try {
    if (!(await writeLease(session, key))) {
      _drop(session, key);
    }
  } catch (err) {
    logger.error('lock.renew: err:', err, key);
  }
}

function _drop(session: Session, key: string): void {
  const lease = session.heldLocks.get(key);
  if (lease) {
    clearInterval(lease.timer);
    session.heldLocks.delete(key);
  }
}

async function release(
  session: Session,
  name: string
): Promise<boolean | null> {
  const key = `${session.transactionDomain}_${name}`;
  const lease = session.heldLocks.get(key);
  if (!lease) {
    return null;
  }
  lease.count--;
  if (lease.count > 0) {
    return true;
  }
  await _releaseLease(session, key);
  return true;
}

async function _releaseLease(session: Session, key: string): Promise<void> {
  _drop(session, key);
  try {
    await session.dynamodb.updateItem({
      table: LOCK_TABLE,
      key: { lock_key: { S: key } },
      expression: 'REMOVE owner_id, expires_at',
      condition: 'owner_id = :owner',
      values: { ':owner': { S: session.lockOwner } },
    });
  } catch (err) {
    if (!isConditionFailure(err)) {
      throw err;
    }
  }
}

export async function releaseAll(session: Session): Promise<number> {
  const keys = [...session.heldLocks.keys()];
  await Promise.all(keys.map((key) => _releaseLease(session, key)));
  return keys.length;
}

async function holder(session: Session, name: string): Promise<string | null> {
  const key = `${session.transactionDomain}_${name}`;
  const sql = `SELECT owner_id, expires_at FROM "${LOCK_TABLE}" WHERE lock_key = '${escapeString(key)}'`;
  const rows = await session.dynamodb.queryQL(sql);
  const row = rows[0];
  const owner = row?.owner_id?.S;
  const expires = Number(row?.expires_at?.N ?? 0);
  if (!owner || expires < Date.now()) {
    return null;
  }
  return owner;
}

export async function runLockFunction(
  session: Session,
  request: LockRequest
): Promise<EvaluationValue> {
  const { fn, args } = request;
  if (fn === 'RELEASE_ALL_LOCKS') {
    return { type: 'longlong', value: await releaseAll(session) };
  }
  const nameValue = args[0]?.value;
  const name = normalizeLockName(
    nameValue === null || nameValue === undefined ? '' : String(nameValue)
  );
  switch (fn) {
    case 'GET_LOCK': {
      const timeout = Number(args[1]?.value ?? 0);
      const timeout_s = timeout < 0 ? Infinity : timeout;
      const got = await acquire(session, name, timeout_s);
      return { type: 'longlong', value: got ? 1 : 0 };
    }
    case 'RELEASE_LOCK': {
      const released = await release(session, name);
      return released === null
        ? { type: 'null', value: null }
        : { type: 'longlong', value: released ? 1 : 0 };
    }
    case 'IS_FREE_LOCK':
      return {
        type: 'longlong',
        value: (await holder(session, name)) === null ? 1 : 0,
      };
    case 'IS_USED_LOCK': {
      const owner = await holder(session, name);
      return owner === null
        ? { type: 'null', value: null }
        : { type: 'longlong', value: Number(owner.split('_')[0]) };
    }
  }
  return { type: 'null', value: null };
}
