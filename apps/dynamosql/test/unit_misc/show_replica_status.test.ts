import { expect } from 'chai';
import { addUnitTest } from '../unit_helper';

function queryAsync(conn: any, sql: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    conn.query(sql, (err: unknown, result: any[]) =>
      err ? reject(err) : resolve(result)
    );
  });
}

describe('SHOW REPLICA STATUS', () => {
  addUnitTest(
    'SHOW REPLICA STATUS returns no rows with a fixed column list',
    async (mod, config) => {
      const conn = mod.createConnection(config);
      try {
        const rows = await queryAsync(conn, 'SHOW REPLICA STATUS');
        expect(rows).to.have.lengthOf(0);
      } finally {
        conn.destroy();
      }
    }
  );
});
