import { expect } from 'chai';
import { addUnitTest } from '../unit_helper';

function queryAsync(conn: any, sql: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    conn.query(sql, (err: unknown, result: any[]) =>
      err ? reject(err) : resolve(result)
    );
  });
}

function destroy(conn: any) {
  conn.destroy();
}

describe('SHOW VARIABLES', () => {
  addUnitTest(
    'SHOW VARIABLES returns Variable_name and Value columns',
    async (mod, config) => {
      const conn = mod.createConnection(config);
      try {
        const rows = await queryAsync(conn, "SHOW VARIABLES LIKE 'sql_mode'");
        expect(rows).to.have.lengthOf(1);
        expect(rows[0].Variable_name).to.equal('sql_mode');
        expect(rows[0].Value).to.be.a('string');
      } finally {
        destroy(conn);
      }
    }
  );
  addUnitTest(
    'SHOW SESSION VARIABLES LIKE matches a pattern',
    async (mod, config) => {
      const conn = mod.createConnection(config);
      try {
        const rows = await queryAsync(
          conn,
          "SHOW SESSION VARIABLES LIKE 'time%'"
        );
        expect(rows.length).to.be.greaterThan(0);
        for (const row of rows) {
          expect(row.Variable_name).to.match(/^time/);
          expect(row.Value).to.be.a('string');
        }
      } finally {
        destroy(conn);
      }
    }
  );
  addUnitTest(
    'SHOW GLOBAL VARIABLES LIKE with no match returns no rows',
    async (mod, config) => {
      const conn = mod.createConnection(config);
      try {
        const rows = await queryAsync(
          conn,
          "SHOW GLOBAL VARIABLES LIKE 'no_such_variable_xyz'"
        );
        expect(rows).to.have.lengthOf(0);
      } finally {
        destroy(conn);
      }
    }
  );
  addUnitTest(
    '@@version and @@version_comment are non-empty strings',
    async (mod, config) => {
      const conn = mod.createConnection(config);
      try {
        const rows = await queryAsync(
          conn,
          'SELECT @@version AS v, @@version_comment AS c'
        );
        expect(rows[0].v).to.be.a('string').and.not.be.empty;
        expect(rows[0].c).to.be.a('string');
      } finally {
        destroy(conn);
      }
    }
  );
});
