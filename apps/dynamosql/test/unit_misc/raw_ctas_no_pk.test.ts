import { assert } from 'chai';
import * as DynamoSQL from '../../src/callbacks';
import { testNamespace } from '../test_namespace';

const TABLE = 'raw_ctas_no_pk_probe';
const NO_PK_LIST = [
  `CREATE TABLE _dynamodb.${TABLE} (id JSON)`,
  `CREATE TABLE _dynamodb.${TABLE} AS SELECT 1 AS id`,
  `CREATE TABLE _dynamodb.${TABLE} (id JSON) AS SELECT 1 AS id`,
];

async function runQuery(
  conn: ReturnType<typeof DynamoSQL.createConnection>,
  sql: string
): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    const rows: Record<string, unknown>[] = [];
    const q = conn.query(sql, []);
    q.on('error', reject);
    q.on('result', (row: Record<string, unknown>) => rows.push(row));
    q.on('end', () => resolve(rows));
  });
}

describe('raw CREATE TABLE without a primary key', () => {
  let conn: ReturnType<typeof DynamoSQL.createConnection>;

  before(() => {
    conn = DynamoSQL.createConnection({ namespace: testNamespace() });
  });

  after(async () => {
    try {
      await runQuery(conn, `DROP TABLE IF EXISTS _dynamodb.${TABLE}`);
    } finally {
      conn.destroy();
    }
  });

  for (const sql of NO_PK_LIST) {
    it(`${sql} fails with ER_REQUIRES_PRIMARY_KEY and creates nothing`, async () => {
      let code: unknown = null;
      try {
        await runQuery(conn, sql);
      } catch (err) {
        code = (err as { code?: unknown }).code;
      }
      assert.equal(code, 'ER_REQUIRES_PRIMARY_KEY');
      const rows = await runQuery(conn, 'SHOW TABLES FROM _dynamodb');
      const names = rows.flatMap((row) => Object.values(row).map(String));
      assert.notInclude(names, TABLE);
    });
  }
});
