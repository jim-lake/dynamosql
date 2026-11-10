import { assert } from 'chai';
import * as DynamoSQL from '../../src';

function runQuery(conn: DynamoSQL.Connection, sql: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const q = conn.query(sql, []);
    q.on('error', reject);
    q.on('end', () => resolve());
  });
}

const TWO_ROW_SETUP = [
  'CREATE DATABASE IF NOT EXISTS lock_unsup_mem',
  'CREATE TEMPORARY TABLE lock_unsup_mem.t (id INT PRIMARY KEY)',
  'INSERT INTO lock_unsup_mem.t (id) VALUES (1), (2)',
];

async function expectUnsupported(sql: string): Promise<void> {
  const conn = DynamoSQL.createConnection({
    namespace: process.env.DYNAMO_NAMESPACE ?? 'dynamosql_test',
  });
  try {
    for (const stmt of TWO_ROW_SETUP) {
      await runQuery(conn, stmt);
    }
    await runQuery(conn, sql);
    assert.fail(`expected ER_FEATURE_UNSUPPORTED for: ${sql}`);
  } catch (err) {
    assert.equal((err as { code?: string }).code, 'ER_FEATURE_UNSUPPORTED');
  } finally {
    conn.destroy();
  }
}

describe('Lock functions outside the select list', () => {
  it('GET_LOCK in WHERE is rejected', async () => {
    await expectUnsupported(
      "SELECT id FROM lock_unsup_mem.t WHERE GET_LOCK('w_lock', 0) = 1"
    );
  });
  it('GET_LOCK in HAVING is rejected', async () => {
    await expectUnsupported(
      "SELECT id FROM lock_unsup_mem.t HAVING GET_LOCK('h_lock', 0) = 1"
    );
  });
  it('GET_LOCK in ORDER BY over two rows is rejected', async () => {
    await expectUnsupported(
      "SELECT id FROM lock_unsup_mem.t ORDER BY GET_LOCK('o_lock', 0), id"
    );
  });
});
