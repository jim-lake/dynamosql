process.env.TZ = 'UTC';

const { assert, expect } = require('chai');
const fs = require('node:fs');
const config = require('../../../config.json');
const mysql = require('mysql');
const { createSession } = require('../src/session');

const { Types } = require('../src/types');

const SECONDS_REGEX = /:[0-9]{2}(\.[0-9]*)?$/g;

process.on('uncaughtException', (err) => {
  console.error('Caught uncaught exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', (err) => {
  console.error('Caught unhandled rejection:', err);
  process.exit(1);
});

export function runTests(test_name, file_path, extra, maybe_skip) {
  const skip = maybe_skip && !process.env.TEST_RUN_SLOW;

  const mysql_opts = Object.assign(
    {
      host: config.db.host,
      port: config.db.port ?? 3306,
      user: config.db.user,
      password: config.db.password,
      //database: config.db.database,
      dateStrings: true,
      charset: 'utf8mb4',
    },
    extra?.mysql
  );
  const mysql_conn = mysql.createConnection(mysql_opts);

  const session_opts = Object.assign(
    {
      namespace: process.env.DYNAMO_NAMESPACE ?? '',
      region: process.env.AWS_REGION,
      resultObjects: false,
      dateStrings: true,
    },
    extra?.session
  );
  const ddb_session = createSession(session_opts);
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
    it(sql, async function () {
      if (skip) {
        return this.skip();
      }
      const mysql_result = {};
      const ddb_result = {};

      const opts = { sql };
      if (extra?.nestTables) {
        opts.nestTables = true;
      }

      await Promise.all([
        new Promise((resolve) => {
          mysql_conn.query(opts, (err, results, fields) => {
            mysql_result.err = err;
            mysql_result.results = results;
            mysql_result.fields = fields;
            resolve();
          });
        }),
        new Promise((resolve) => {
          ddb_session.query(opts, (err, results, fields) => {
            if (err) {
              err.cause = null;
            }
            ddb_result.err = err;
            ddb_result.results = results;
            ddb_result.fields = fields;
            resolve();
          });
        }),
      ]);

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
            ddb_result.fields.forEach((column, j) => {
              const name = column.name;
              const left = String(result[j]);
              const right = String(mysql_result.results[i][name]);
              _checkEqual(name, i, left, right);
            });
          } else {
            ddb_result.fields.forEach((column) => {
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
        if (mysql_result.fields === undefined) {
          expect(ddb_result.fields, 'fields should be undefined').to.be
            .undefined;
        } else {
          expect(
            ddb_result.fields.length,
            'fields should be the same length'
          ).to.equal(mysql_result.fields.length);
          if (extra?.verify_field_types) {
            for (let i = 0; i < ddb_result.fields.length; i++) {
              const ddb_field = ddb_result.fields[i];
              const mysql_field = mysql_result.fields[i];
              const ddb_type = Types[ddb_field.type];
              const mysql_type = Types[mysql_field.type];
              expect(ddb_type, `field ${ddb_field.name} type`).to.equal(
                mysql_type
              );
            }
          }
        }
      } else {
        if (extra?.skipAffected !== true) {
          expect(
            ddb_result.results?.affectedRows,
            'affectedRows equal'
          ).to.equal(mysql_result.results?.affectedRows);
        }
        if (extra?.checkChanged) {
          expect(ddb_result.results?.changedRows, 'changedRows equal').to.equal(
            mysql_result.results?.changedRows
          );
        }
      }
    });
  }
}
function _checkEqual(name, i, left, right) {
  if (name === 'ignore_seconds') {
    expect(
      left.length,
      `results[${i}].${name}: (${left}).length === (${right}).length`
    ).to.equal(right.length);
    if (left.length === 8) {
      const l_time = Date.parse('2020-01-01 ' + left);
      const r_time = Date.parse('2020-01-01 ' + right);
      const delta = Math.abs(l_time - r_time);
      expect(
        delta,
        `delta results[${i}].${name} left: ${left} (${l_time}) right: ${right} (${r_time}) < 2000`
      ).to.be.lt(2000);
    } else if (left.length >= 19) {
      const l_time = Date.parse(left);
      const r_time = Date.parse(right);
      const delta = Math.abs(l_time - r_time);
      expect(
        delta,
        `delta results[${i}].${name} left: ${left} (${l_time}) right: ${right} (${r_time}) < 2000`
      ).to.be.lt(2000);
    } else {
      left = String(left).replace(SECONDS_REGEX, '');
      right = String(right).replace(SECONDS_REGEX, '');
      expect(left, `results[${i}].${name} equal`).to.equal(right);
    }
  } else if (left instanceof Date) {
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
