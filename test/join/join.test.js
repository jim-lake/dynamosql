const async = require('async');
const { expect } = require('chai');
const fs = require('node:fs');
const path = require('node:path');
const config = require('../../config');
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
const ddb_session = Session.newSession();

const SETUP_SQL_LIST = fs
  .readFileSync(path.join(__dirname, 'setup.sql'), 'utf8')
  .split(';')
  .map((s) => s.trim())
  .filter((s) => s.length > 0);
/*
before(function (done) {
  this.timeout(10000 * SETUP_SQL_LIST.length);

  async.eachSeries(
    SETUP_SQL_LIST,
    (sql, done) => {
      console.log('before:', sql);
      async.series(
        [
          (done) => {
            mysql_conn.query(sql, (err) => {
              if (err) {
                console.log('before mysql:', sql, 'err:', err);
              }
              done(err);
            });
          },
          (done) => {
            ddb_session.query(sql, (err) => {
              if (err) {
                console.log('before ddb:', sql, 'err:', err);
              }
              done(err);
            });
          },
        ],
        (err) => {
          console.log('before: done: err:', err);
          done(err);
        }
      );
    },
    done
  );
});
*/
after(() => {
  mysql_conn.destroy();
});

const SQL_LIST = fs
  .readFileSync(path.join(__dirname, 'join.sql'), 'utf8')
  .split(';')
  .map((s) => s.trim())
  .filter((s) => s.length > 0);
const SQL1 = `SELECT 1 + 1 AS foo`;

_runTest(SQL1);

SQL_LIST.forEach((sql) => _runTest(sql));

function _runTest(sql) {
  describe('Join', function () {
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

          ddb_result.results.forEach((result, i) => {
            ddb_result.columns.forEach((column, j) => {
              console.log(
                column.name,
                ':',
                result[j],
                '===',
                mysql_result.results[i][column.name]
              );
              expect(
                String(result[j]),
                `results[${i}].${column.name} equal`
              ).to.equal(String(mysql_result.results[i][column.name]));
            });
          });
          done();
        }
      );
    });
  });
}
