import * as Engine from './engine';

import type { DynamoDBWithCache } from './dynamodb';
import type { HandlerParams } from './handler_types';
import type { Session } from '../session';
import type { CommitParams } from './engine';
import type { Transaction as TransactionAST } from 'node-sql-parser';

export async function query(
  params: HandlerParams<TransactionAST>
): Promise<void> {
  const { dynamodb, session, ast } = params;
  const action = ast.expr?.action?.value?.toLowerCase();
  if (action === 'begin' || action === 'start') {
    startTransaction({ session, auto_commit: false });
  } else if (action === 'commit') {
    await commit({ dynamodb, session });
  } else if (action === 'rollback') {
    await rollback({ dynamodb, session });
  }
}

export class Transaction {
  _dataMap = new Map<string, unknown>();
  _isAutoCommit: boolean;

  constructor(auto_commit: boolean) {
    this._isAutoCommit = Boolean(auto_commit);
  }
  public isAutoCommit(): boolean {
    return this._isAutoCommit;
  }
  public getEngineNameList() {
    return this._dataMap.keys();
  }
  public getData<T>(name: string): T | undefined {
    return this._dataMap.get(name) as T | undefined;
  }
  public setData(name: string, data: unknown) {
    this._dataMap.set(name, data);
  }
}

type WithTransaction<S> = S & { transaction: Transaction };
export type TransactionFunctionParams<
  R,
  S extends HandlerParams<R>,
> = WithTransaction<S>;

export type TransactionRunFunction<R, S extends HandlerParams<R>, T> = (
  params: WithTransaction<S>
) => Promise<T>;

export async function run<R, S extends HandlerParams<R>, T>(
  func: TransactionRunFunction<R, S, T>,
  params: S
): Promise<T> {
  const { dynamodb, session } = params;
  const transaction = startTransaction({ session, auto_commit: true });
  try {
    const result = await func({ ...params, transaction });
    if (transaction.isAutoCommit()) {
      await commit({ dynamodb, session });
    }
    return result;
  } catch (err) {
    if (transaction.isAutoCommit()) {
      await rollback({ dynamodb, session });
    }
    throw err;
  }
}
export interface StartTransactionParams {
  session: Session;
  auto_commit: boolean;
}
export function startTransaction(params: StartTransactionParams): Transaction {
  const { session, auto_commit } = params;
  const existing = session.getTransaction();
  if (existing) {
    return existing;
  }
  const tx = new Transaction(auto_commit);
  session.setTransaction(tx);
  return tx;
}
interface InternalCommitParams {
  dynamodb: DynamoDBWithCache;
  session: Session;
}
export async function commit(params: InternalCommitParams): Promise<void> {
  await _txEach(params, async ({ engine, ...other }) => {
    await engine.commit(other as CommitParams);
  });
}
export async function rollback(params: InternalCommitParams): Promise<void> {
  await _txEach(params, async ({ engine, ...other }) => {
    await engine.rollback(other as CommitParams);
  });
}
type TxEachCallback<T> = (params: CommitParams<T>) => Promise<void>;
async function _txEach<T>(
  params: InternalCommitParams,
  callback: TxEachCallback<T>
) {
  const { dynamodb, session } = params;
  const transaction = session.getTransaction();
  if (transaction) {
    for (const name of transaction.getEngineNameList()) {
      const engine = Engine.getEngineByName(name);
      const data = transaction.getData<T>(name) ?? {};
      await callback({ engine, dynamodb, session, transaction, data });
    }
    session.setTransaction(null);
  }
}
