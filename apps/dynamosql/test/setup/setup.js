const async = require('async');
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
  multipleStatements: true,
  dateStrings: true,
});

Session.init();
const ddb_session = Session.createSession();

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
  it(sql, function (done) {
    const mysql_result = {};
    const ddb_result = {};

    async.series(
      [
        (done) => {
          mysql_conn.query(sql, (err, results, columns) => {
            mysql_result.err = err;
            mysql_result.results = results;
            mysql_result.columns = columns;
            done();
          });
        },
        (done) => {
          ddb_session.query(sql, (err, results, columns) => {
            ddb_result.err = err;
            ddb_result.results = results;
            ddb_result.columns = columns;
            done();
          });
        },
      ],
      () => {
        expect(ddb_result.err, 'err equality').to.equal(mysql_result.err);
        expect(ddb_result.results.length, 'results length').to.equal(
          mysql_result.results.length
        );
        done();
      }
    );
  });
}
