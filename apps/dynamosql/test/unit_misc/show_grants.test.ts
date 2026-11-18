import { expect } from 'chai';
import { addUnitTest } from '../unit_helper';

function queryAsync(conn: any, sql: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    conn.query(sql, (err: unknown, result: any[]) =>
      err ? reject(err) : resolve(result)
    );
  });
}

describe('SHOW GRANTS', () => {
  addUnitTest(
    'SHOW GRANTS returns one Grants for user@host column',
    async (mod, config) => {
      const conn = mod.createConnection(config);
      try {
        const rows = await queryAsync(conn, 'SHOW GRANTS');
        expect(rows).to.have.lengthOf(3);
        const columns = Object.keys(rows[0]);
        expect(columns).to.have.lengthOf(1);
        const column = String(columns[0]);
        expect(column).to.match(/^Grants for .+@.+$/);
        for (const row of rows) {
          expect(row[column]).to.be.a('string');
          expect(row[column]).to.match(/^GRANT /);
        }
      } finally {
        conn.destroy();
      }
    }
  );
});
