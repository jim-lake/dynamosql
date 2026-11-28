import { expect } from 'chai';
import { createSession } from '../src/session';
import {
  CONNECTION_COLLATION,
  SQL_MODE,
  readSqlStatements,
  sessionOptions,
} from './test_sql_helper';

interface DynamoTestExtra {
  timeout?: number;
}

interface FieldInfo {
  name: string;
}

interface QueryOutcome {
  err?: any;
  results?: any;
  fields?: FieldInfo[];
}

const PASSING_ASSERT_VALUES: unknown[] = [1, 1n, true, '1'];

export function runDynamoTests(
  test_name: string,
  file_path: string,
  extra?: DynamoTestExtra
) {
  const sql_list = readSqlStatements(file_path);

  let ddb_session: ReturnType<typeof createSession>;
  describe(test_name, function (this: Mocha.Suite) {
    this.timeout(extra?.timeout || 5000);
    before(async () => {
      ddb_session = createSession(sessionOptions());
      const settings = [
        `SET SESSION sql_mode = '${SQL_MODE}'`,
        `SET SESSION collation_connection = '${CONNECTION_COLLATION}'`,
      ];
      for (const setting of settings) {
        await new Promise<void>((resolve, reject) => {
          ddb_session.query(setting, (err: unknown) =>
            err ? reject(err) : resolve()
          );
        });
      }
    });
    after(() => {
      ddb_session?.destroy();
    });
    sql_list.forEach((sql) => {
      it(sql, async function () {
        const outcome = await new Promise<QueryOutcome>((resolve) => {
          ddb_session.query({ sql }, (err: any, results: any, fields: any) => {
            if (err) {
              err.cause = null;
            }
            resolve({ err, results, fields });
          });
        });

        expect(
          outcome.err ? `${outcome.err.code}: ${outcome.err.message}` : null,
          `${sql} dynamodb error`
        ).to.equal(null);

        const fields = outcome.fields ?? [];
        const assert_indexes = fields.flatMap((field, j) =>
          field.name.startsWith('assert_') ? [j] : []
        );
        if (assert_indexes.length === 0) {
          return;
        }

        const rows: unknown[][] = Array.isArray(outcome.results)
          ? outcome.results
          : [];
        expect(
          rows.length,
          `${sql} assert_ columns need at least one row`
        ).to.be.greaterThan(0);
        rows.forEach((row, i) => {
          for (const j of assert_indexes) {
            const value = row[j];
            expect(
              PASSING_ASSERT_VALUES.includes(value),
              `${sql}: column ${fields[j]?.name} row ${i} value ${String(value)} (${typeof value}) must be 1, true, or '1'`
            ).to.equal(true);
          }
        });
      });
    });
  });
}
