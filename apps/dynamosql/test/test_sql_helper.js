process.env.TZ = 'UTC';

exports.runTests = runTests;

const async = require('async');
const { assert, expect } = require('chai');
const fs = require('node:fs');
const config = require('../../../config');
const mysql = require('mysql');
const Session = require('../src/session');

const SECONDS_REGEX = /:[0-9]{2}(\.[0-9]*)?$/g;

function runTests(test_name, file_path, extra) {
  const mysql_opts = Object.assign(
    {
      host: config.db.host,
      port: config.db.port || 3306,
      user: config.db.user,
      password: config.db.password,
      //database: config.db.database,
      multipleStatements: true,
      dateStrings: true,
    },
    extra?.mysql
  );
  const mysql_conn = mysql.createConnection(mysql_opts);

  const session_opts = Object.assign({ resultObjects: false }, extra?.session);
  const ddb_session = Session.createSession(session_opts);
  after(() => {
    mysql_conn.destroy();
    ddb_session.destroy();
  });

  const data = fs.readFileSync(file_path, 'utf8');
  const sql_list = data
    .replace(/--.*$/gm, '\n')
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  describe(test_name, function () {
    this.timeout(extra?.timeout || 5000);
    sql_list.forEach((sql) => _runTest(sql));
  });
  function _runTest(sql) {
    it(sql, function (done) {
      const mysql_result = {};
      const ddb_result = {};

      const opts = { sql };
      if (extra?.nestTables) {
        opts.nestTables = true;
      }

      async.parallel(
        [
          (done) => {
            mysql_conn.query(opts, (err, results, columns) => {
              mysql_result.err = err;
              mysql_result.results = results;
              mysql_result.columns = columns;
              done();
            });
          },
          (done) => {
            ddb_session.query(opts, (err, results, columns) => {
              ddb_result.err = err;
              ddb_result.results = results;
              ddb_result.columns = columns;
              done();
            });
          },
        ],
        () => {
          try {
            if (ddb_result.err && !mysql_result.err) {
              console.error('unexpected ddb_result.err:', ddb_result.err);
              expect(ddb_result.err, 'err equality').to.equal(mysql_result.err);
            } else if (!ddb_result.err && mysql_result.err) {
              console.error(
                'unexpected ddb_result success, mysql err:',
                mysql_result.err
              );
              expect(ddb_result.err, 'err equality').to.equal(mysql_result.err);
            } else if (
              ddb_result.err &&
              ddb_result.err.code !== mysql_result.err?.code
            ) {
              expect(ddb_result.err, 'err equality').to.equal(mysql_result.err);
            }

            expect(ddb_result.results?.length, 'results length').to.equal(
              mysql_result.results?.length
            );
            expect(
              Array.isArray(ddb_result.results),
              'results both arrays or both not arrays'
            ).to.equal(Array.isArray(mysql_result.results));

            if (Array.isArray(ddb_result.results)) {
              ddb_result.results?.forEach?.((result, i) => {
                if (Array.isArray(result)) {
                  ddb_result.columns.forEach((column, j) => {
                    const name = column.name;
                    const left = String(result[j]);
                    const right = String(mysql_result.results[i][name]);
                    _checkEqual(name, i, left, right);
                  });
                } else {
                  ddb_result.columns.forEach((column) => {
                    const { table, name } = column;
                    const left = opts.nestTables
                      ? result[table]?.[name]
                      : result[name];
                    const right = opts.nestTables
                      ? mysql_result.results[i]?.[table]?.[name]
                      : mysql_result.results[i][name];
                    _checkEqual(name, i, left, right);
                  });
                }
              });
            } else {
              if (extra?.skipAffected !== true) {
                expect(
                  ddb_result.results?.affectedRows,
                  'affectedRows equal'
                ).to.equal(mysql_result.results?.affectedRows);
              }
              if (extra?.checkChanged) {
                expect(
                  ddb_result.results?.changedRows,
                  'changedRows equal'
                ).to.equal(mysql_result.results?.changedRows);
              }
            }
            done();
          } catch (e) {
            done(e);
          }
        }
      );
    });
  }
}
function _checkEqual(name, i, left, right) {
  if (name === 'ignore_seconds') {
    expect(left.length, `results[${i}].${name} length equal`).to.equal(
      right.length
    );
    left = String(left).replace(SECONDS_REGEX, '');
    right = String(right).replace(SECONDS_REGEX, '');
  }
  if (left instanceof Date) {
    assert(right instanceof Date, 'both are dates');
    expect(left.getTime(), `results[${i}].${name} typeof equal`).to.equal(
      right.getTime()
    );
  } else if (Buffer.isBuffer(left)) {
    assert(Buffer.isBuffer(right), 'both are buffers');
    assert(
      Buffer.compare(left, right) === 0,
      `results[${i}].${name} buffers not equal`
    );
  } else {
    expect(left, `results[${i}].${name} equal`).to.equal(right);
  }
}
