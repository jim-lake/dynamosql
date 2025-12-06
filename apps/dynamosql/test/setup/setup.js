const { expect } = require('chai');
const fs = require('node:fs');
const path = require('node:path');
const config = require('../../../../config');
const mysql = require('mysql');
const Session = require('../../src/session');

const mysql_conn = mysql.createConnection({
  host: config.db.host,
  port: config.db.port || 3306,
  user: config.db.user,
  password: config.db.password,
  //database: config.db.database,
  charset: 'utf8mb4',
  multipleStatements: true,
  dateStrings: true,
});

const namespace = process.env.DYNAMO_NAMESPACE ?? '';
const region = process.env.AWS_REGION;
console.log('namespace:', namespace);
console.log('region:', region);

const ddb_session = Session.createSession({ namespace, region });

after(() => {
  mysql_conn.destroy();
});

const SQL_LIST = fs
  .readFileSync(path.join(__dirname, 'setup.sql'), 'utf8')
  .split(';')
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

describe('setup.sql', function () {
  this.timeout(15000);
  SQL_LIST.forEach((sql) => _runTest(sql));
});

function _runTest(sql) {
  it(sql, async function () {
    const mysql_result = {};
    const ddb_result = {};

    await new Promise((resolve) => {
      mysql_conn.query(sql, (err, results, columns) => {
        mysql_result.err = err;
        mysql_result.results = results;
        mysql_result.columns = columns;
        resolve();
      });
    });
    await new Promise((resolve) => {
      ddb_session.query(sql, (err, results, columns) => {
        ddb_result.err = err;
        ddb_result.results = results;
        ddb_result.columns = columns;
        resolve();
      });
    });

    if (
      ddb_result.err?.code === 'ER_DBACCESS_DENIED_ERROR' &&
      sql.includes('DROP DATABASE')
    ) {
      // ignore DROP DATABASE MISMATCH
      return;
    }

    expect(ddb_result.err, 'err equality').to.equal(mysql_result.err);
    expect(ddb_result.results.length, 'results length').to.equal(
      mysql_result.results.length
    );
  });
}
