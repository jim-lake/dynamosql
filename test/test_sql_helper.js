exports.runTests = runTests;

const async = require('async');
const { expect } = require('chai');
const fs = require('node:fs');
const config = require('../config');
const mysql = require('mysql');
const Session = require('../src/session');

const SECONDS_REGEX = /:[0-9]{2}(\.[0-9]*)?$/g;

function runTests(test_name, file_path) {
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
  after(() => {
    mysql_conn.destroy();
  });

  const SQL_LIST = fs
    .readFileSync(file_path, 'utf8')
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  SQL_LIST.forEach((sql) => _runTest(sql));

  function _runTest(sql) {
    describe(test_name, function () {
      it(sql, function (done) {
        const mysql_result = {};
        const ddb_result = {};

        async.parallel(
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
            if (ddb_result.err && !mysql_result.err) {
              console.error('unexpected ddb_result.err:', ddb_result.err);
            }
            if (ddb_result.err && ddb_result.err !== mysql_result.err.code) {
              expect(ddb_result.err, 'err equality').to.equal(mysql_result.err);
            }
            expect(ddb_result?.results?.length, 'results length').to.equal(
              mysql_result?.results?.length
            );

            ddb_result?.results?.forEach?.((result, i) => {
              ddb_result.columns.forEach((column, j) => {
                const name = column.name;
                let left = String(result[j]);
                let right = String(mysql_result.results[i][name]);
                if (name === 'ignore_seconds') {
                  expect(
                    left.length,
                    `results[${i}].${name} length equal`
                  ).to.equal(right.length);
                  left = left.replace(SECONDS_REGEX, '');
                  right = right.replace(SECONDS_REGEX, '');
                }
                expect(left, `results[${i}].${name} equal`).to.equal(right);
              });
            });
            done();
          }
        );
      });
    });
  }
}
