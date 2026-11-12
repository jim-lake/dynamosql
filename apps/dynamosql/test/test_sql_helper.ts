process.env.TZ = 'UTC';

import { assert, expect } from 'chai';
import fs from 'node:fs';
import * as mysql from 'mysql';
import { createSession } from '../src/session';
import { Types } from '../src/types';
import { isDeepStrictEqual } from 'node:util';

interface FieldInfo {
  name: string;
  table: string;
  type: number;
}

interface TestExtra {
  mysql?: Record<string, unknown>;
  session?: Record<string, unknown>;
  timeout?: number;
  allowedErrors?: string;
  nestTables?: boolean;
  verify_field_types?: boolean;
  skipAffected?: boolean;
  checkChanged?: boolean;
}

interface QueryOutcome {
  err?: any;
  results?: any;
  fields?: FieldInfo[];
}

const SECONDS_REGEX = /:[0-9]{2}(\.[0-9]*)?$/g;

process.on('uncaughtException', (err) => {
  console.error('Caught uncaught exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', (err) => {
  console.error('Caught unhandled rejection:', err);
  process.exit(1);
});

export function runTests(
  test_name: string,
  file_path: string,
  extra?: TestExtra,
  maybe_skip?: boolean
) {
  const skip = maybe_skip && !process.env.TEST_RUN_SLOW;

  const mysql_opts = Object.assign(
    {
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '3306'),
      user: process.env.DB_USER ?? 'root',
      password: process.env.DB_PASSWORD ?? '',
      //database: config.db.database,
      dateStrings: true,
      charset: 'utf8mb4',
    },
    extra?.mysql
  );
  const mysql_conn = mysql.createConnection(mysql_opts);

  const session_opts = Object.assign(
    {
      namespace: process.env.DYNAMO_NAMESPACE ?? 'dynamosql_test',
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

  describe(test_name, function (this: Mocha.Suite) {
    this.timeout(extra?.timeout || 5000);
    sql_list.forEach((sql) => _runTest(sql));
  });
  function _runTest(sql: string) {
    it(sql, async function (this: Mocha.Context) {
      if (skip) {
        return this.skip();
      }
      const mysql_result: QueryOutcome = {};
      const ddb_result: QueryOutcome = {};

      const opts: { sql: string; nestTables?: boolean } = { sql };
      if (extra?.nestTables) {
        opts.nestTables = true;
      }

      await Promise.all([
        new Promise<void>((resolve) => {
          mysql_conn.query(opts, (err: any, results: any, fields: any) => {
            mysql_result.err = err;
            mysql_result.results = results;
            mysql_result.fields = fields;
            resolve();
          });
        }),
        new Promise<void>((resolve) => {
          ddb_session.query(opts, (err: any, results: any, fields: any) => {
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

      if ((extra?.allowedErrors ?? 'NONE') === 'NONE') {
        expect(mysql_result.err?.code ?? null, 'mysql error').to.equal(null);
        expect(ddb_result.err?.code ?? null, 'dynamodb error').to.equal(null);
      }

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
        const ddb_fields = ddb_result.fields ?? [];
        ddb_result.results?.forEach?.((result: any, i: number) => {
          if (Array.isArray(result)) {
            ddb_fields.forEach((column, j) => {
              const name = column.name;
              const left = String(result[j]);
              const right = String(mysql_result.results[i][name]);
              _checkEqual(name, i, left, right);
            });
          } else {
            ddb_fields.forEach((column) => {
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
            ddb_fields.length,
            'fields should be the same length'
          ).to.equal(mysql_result.fields.length);
          if (extra?.verify_field_types) {
            for (const [i, ddb_field] of ddb_fields.entries()) {
              const mysql_field = mysql_result.fields[i]!;
              const ddb_type = Types[ddb_field.type];
              const mysql_type = Types[mysql_field.type];
              if (mysql_type === 'MEDIUM_BLOB' || mysql_type === 'LONG_BLOB') {
                // these are legacy dumb codepaths in mysql,
                // we standardize on blob, if anyone wants to make a very
                // trivial fix to follow this dumb behavior without
                // opening a can of worms that would be fine
                expect(ddb_type, `field ${ddb_field.name} type`).to.equal(
                  'BLOB'
                );
              } else {
                expect(ddb_type, `field ${ddb_field.name} type`).to.equal(
                  mysql_type
                );
              }
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
function _checkEqual(name: string, i: number, left: any, right: any) {
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
  } else if (name === 'json_value') {
    expect(
      left === right || isDeepStrictEqual(JSON.parse(left), JSON.parse(right)),
      `results[${i}].${name} json equal: ${left} vs ${right}`
    ).to.be.true;
  } else if (name === 'json_unsorted_array') {
    const left_array = JSON.parse(left);
    const right_array = JSON.parse(right);
    expect(Array.isArray(left_array), `results[${i}].${name} left is array`).to
      .be.true;
    expect(Array.isArray(right_array), `results[${i}].${name} right is array`)
      .to.be.true;
    expect(
      isDeepStrictEqual(left_array.sort(), right_array.sort()),
      `results[${i}].${name} unsorted json equal: ${left} vs ${right}`
    ).to.be.true;
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
