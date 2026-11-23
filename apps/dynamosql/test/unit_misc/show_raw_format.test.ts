import { assert } from 'chai';
import * as DynamoSQL from '../../src/callbacks';
import { testNamespace } from '../test_namespace';

const TABLE = 'show_raw_format_probe';

async function runQuery(
  conn: ReturnType<typeof DynamoSQL.createConnection>,
  sql: string
): Promise<{ rows: Record<string, unknown>[]; fields: { name: string }[] }> {
  return new Promise((resolve, reject) => {
    const rows: Record<string, unknown>[] = [];
    let fields: { name: string }[] = [];
    const q = conn.query(sql, []);
    q.on('error', reject);
    q.on('fields', (f: { name: string }[]) => {
      fields = f;
    });
    q.on('result', (row: Record<string, unknown>) => rows.push(row));
    q.on('end', () => resolve({ rows, fields }));
  });
}

describe('SHOW on raw (_dynamodb) tables', () => {
  let conn: ReturnType<typeof DynamoSQL.createConnection>;

  before(async () => {
    conn = DynamoSQL.createConnection({ namespace: testNamespace() });
    await runQuery(conn, `DROP TABLE IF EXISTS _dynamodb.${TABLE}`);
    await runQuery(
      conn,
      `CREATE TABLE _dynamodb.${TABLE} (id INT PRIMARY KEY, name VARCHAR(20), amount DECIMAL(10,2), flag BOOLEAN)`
    );
  });

  after(async () => {
    try {
      await runQuery(conn, `DROP TABLE IF EXISTS _dynamodb.${TABLE}`);
    } finally {
      conn.destroy();
    }
  });

  it('SHOW COLUMNS returns valid column rows', async () => {
    const { rows, fields } = await runQuery(
      conn,
      `SHOW COLUMNS FROM _dynamodb.${TABLE}`
    );
    assert.deepEqual(
      fields.map((f) => f.name),
      ['Field', 'Type', 'Null', 'Key', 'Default', 'Extra']
    );
    assert.isAtLeast(rows.length, 1);
    for (const row of rows) {
      assert.typeOf(row.Field, 'string');
      assert.typeOf(row.Type, 'string');
      assert.include(['YES', 'NO'], row.Null);
      assert.include(['', 'PRI', 'UNI', 'MUL'], row.Key);
    }
  });

  it('SHOW FULL COLUMNS adds collation, privileges and comment', async () => {
    const { rows, fields } = await runQuery(
      conn,
      `SHOW FULL COLUMNS FROM _dynamodb.${TABLE}`
    );
    assert.deepEqual(
      fields.map((f) => f.name),
      [
        'Field',
        'Type',
        'Null',
        'Key',
        'Default',
        'Extra',
        'Collation',
        'Privileges',
        'Comment',
      ]
    );
    assert.isAtLeast(rows.length, 1);
    for (const row of rows) {
      assert.include(['utf8mb4_0900_bin', null], row.Collation);
      assert.typeOf(row.Privileges, 'string');
      assert.typeOf(row.Comment, 'string');
    }
  });

  it('SHOW INDEX returns 15 columns per row', async () => {
    const { rows, fields } = await runQuery(
      conn,
      `SHOW INDEX FROM _dynamodb.${TABLE}`
    );
    assert.equal(fields.length, 15);
    assert.isAtLeast(rows.length, 1);
    for (const row of rows) {
      assert.typeOf(row.Key_name, 'string');
      assert.typeOf(row.Column_name, 'string');
      assert.include(['0', '1'], row.Non_unique);
    }
  });

  it('SHOW INDEXES and SHOW KEYS return the same columns as SHOW INDEX', async () => {
    const index = await runQuery(conn, `SHOW INDEX FROM _dynamodb.${TABLE}`);
    for (const keyword of ['INDEXES', 'KEYS']) {
      const other = await runQuery(
        conn,
        `SHOW ${keyword} FROM _dynamodb.${TABLE}`
      );
      assert.deepEqual(
        other.fields.map((f) => f.name),
        index.fields.map((f) => f.name)
      );
    }
  });

  it('SHOW CREATE TABLE returns a CREATE TABLE statement', async () => {
    const { rows } = await runQuery(
      conn,
      `SHOW CREATE TABLE _dynamodb.${TABLE}`
    );
    assert.equal(rows.length, 1);
    const text = rows[0]?.['Create Table'];
    assert.typeOf(text, 'string');
    const sql = text as string;
    assert.match(
      sql,
      new RegExp(`^CREATE (TEMPORARY )?TABLE \`${TABLE}\` \\(`)
    );
    assert.match(
      sql,
      /\) ENGINE=\w+ DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin$/
    );
    assert.match(sql, /PRIMARY KEY \(`[^`]+`\)/);
  });
});
