import { assert } from 'chai';
import type { Connection } from 'mysql';
import * as DynamoSQL from '../../src';
import { addUnitTest } from '../unit_helper';

type Row = Record<string, unknown>;

function run(conn: Connection, sql: string): Promise<Row[]> {
  return new Promise<Row[]>((resolve, reject) => {
    const rows: Row[] = [];
    const q = conn.query(sql, []);
    q.on('result', (row: Row) => {
      rows.push(row);
    });
    q.on('error', reject);
    q.on('end', () => {
      resolve(rows);
    });
  });
}

async function scalar(
  conn: Connection,
  sql: string,
  column: string
): Promise<number> {
  const rows = await run(conn, sql);
  return Number(rows[0]?.[column]);
}

describe('Lock contention between sessions', () => {
  addUnitTest(
    'second session is blocked while first holds the lock',
    async (mod, config) => {
      const a = mod.createConnection(config);
      const b = mod.createConnection(config);
      try {
        assert.equal(
          await scalar(a, "SELECT GET_LOCK('ct_block', 0) AS g", 'g'),
          1
        );
        assert.equal(
          await scalar(b, "SELECT GET_LOCK('ct_block', 0) AS g", 'g'),
          0
        );
        assert.equal(
          await scalar(a, "SELECT RELEASE_LOCK('ct_block') AS r", 'r'),
          1
        );
        assert.equal(
          await scalar(b, "SELECT GET_LOCK('ct_block', 0) AS g", 'g'),
          1
        );
        assert.equal(
          await scalar(b, "SELECT RELEASE_LOCK('ct_block') AS r", 'r'),
          1
        );
      } finally {
        a.destroy();
        b.destroy();
      }
    }
  );

  addUnitTest(
    'waiting session acquires after the holder releases',
    async (mod, config) => {
      const a = mod.createConnection(config);
      const b = mod.createConnection(config);
      try {
        assert.equal(
          await scalar(a, "SELECT GET_LOCK('ct_wait', 0) AS g", 'g'),
          1
        );
        const waiting = scalar(b, "SELECT GET_LOCK('ct_wait', 5) AS g", 'g');
        await new Promise((resolve) => setTimeout(resolve, 500));
        await run(a, "SELECT RELEASE_LOCK('ct_wait') AS r");
        assert.equal(await waiting, 1);
        await run(b, "SELECT RELEASE_LOCK('ct_wait') AS r");
      } finally {
        a.destroy();
        b.destroy();
      }
    }
  );

  addUnitTest(
    'waiting session times out while the lock is held',
    async (mod, config) => {
      const a = mod.createConnection(config);
      const b = mod.createConnection(config);
      try {
        assert.equal(
          await scalar(a, "SELECT GET_LOCK('ct_timeout', 0) AS g", 'g'),
          1
        );
        assert.equal(
          await scalar(b, "SELECT GET_LOCK('ct_timeout', 1) AS g", 'g'),
          0
        );
        await run(a, "SELECT RELEASE_LOCK('ct_timeout') AS r");
      } finally {
        a.destroy();
        b.destroy();
      }
    }
  );

  addUnitTest(
    'reentrant holder needs matching releases before another session can acquire',
    async (mod, config) => {
      const a = mod.createConnection(config);
      const b = mod.createConnection(config);
      try {
        assert.equal(
          await scalar(a, "SELECT GET_LOCK('ct_reenter', 0) AS g", 'g'),
          1
        );
        assert.equal(
          await scalar(a, "SELECT GET_LOCK('ct_reenter', 0) AS g", 'g'),
          1
        );
        assert.equal(
          await scalar(a, "SELECT RELEASE_LOCK('ct_reenter') AS r", 'r'),
          1
        );
        assert.equal(
          await scalar(b, "SELECT GET_LOCK('ct_reenter', 0) AS g", 'g'),
          0
        );
        assert.equal(
          await scalar(a, "SELECT RELEASE_LOCK('ct_reenter') AS r", 'r'),
          1
        );
        assert.equal(
          await scalar(b, "SELECT GET_LOCK('ct_reenter', 0) AS g", 'g'),
          1
        );
        await run(b, "SELECT RELEASE_LOCK('ct_reenter') AS r");
      } finally {
        a.destroy();
        b.destroy();
      }
    }
  );

  it('different transactionDomain values do not contend', async () => {
    const a = DynamoSQL.createConnection({
      namespace: process.env.DYNAMO_NAMESPACE ?? 'dynamosql_test',
      transactionDomain: 'ct_domain_a',
    });
    const b = DynamoSQL.createConnection({
      namespace: process.env.DYNAMO_NAMESPACE ?? 'dynamosql_test',
      transactionDomain: 'ct_domain_b',
    });
    try {
      assert.equal(
        await scalar(a, "SELECT GET_LOCK('ct_domain', 0) AS g", 'g'),
        1
      );
      assert.equal(
        await scalar(b, "SELECT GET_LOCK('ct_domain', 0) AS g", 'g'),
        1
      );
      await run(a, "SELECT RELEASE_LOCK('ct_domain') AS r");
      await run(b, "SELECT RELEASE_LOCK('ct_domain') AS r");
    } finally {
      a.destroy();
      b.destroy();
    }
  });
});
