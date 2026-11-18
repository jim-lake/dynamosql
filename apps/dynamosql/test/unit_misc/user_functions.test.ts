import { expect } from 'chai';
import { addUnitTest } from '../unit_helper';

function queryAsync(conn: any, sql: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    conn.query(sql, (err: unknown, result: any[]) =>
      err ? reject(err) : resolve(result)
    );
  });
}

describe('USER() family', () => {
  for (const fn of [
    'USER()',
    'CURRENT_USER()',
    'SESSION_USER()',
    'SYSTEM_USER()',
  ]) {
    addUnitTest(
      `SELECT ${fn} returns a user@host string`,
      async (mod, config) => {
        const conn = mod.createConnection(config);
        try {
          const rows = await queryAsync(conn, `SELECT ${fn} AS u`);
          expect(rows).to.have.lengthOf(1);
          expect(rows[0].u).to.be.a('string');
          expect(rows[0].u).to.match(/^.+@.+$/);
        } finally {
          conn.destroy();
        }
      }
    );
  }
});
