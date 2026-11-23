import * as mysql from 'mysql2';
import * as DynamoSQL from '../src/callbacks';
import { testNamespace } from './test_namespace';

const dbConfig = {
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '3306'),
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
};

export function addUnitTest(
  name: string,
  testFunction: (
    lib: typeof DynamoSQL,
    config: Record<string, unknown>
  ) => void | Promise<void>,
  slow = false
) {
  it(`${name} => mysql`, async function () {
    if (slow && !process.env.TEST_RUN_SLOW) {
      return this.skip();
    }
    const mysql_opts = {
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      multipleStatements: true,
      dateStrings: true,
      decimalNumbers: true,
    };
    // mysql2 emits an unhandled 'error' when a connection is destroyed mid-handshake, which node-mysql swallowed.
    const referenceClient = {
      ...mysql,
      createConnection(opts: mysql.ConnectionOptions) {
        const conn = mysql.createConnection(opts);
        conn.on('error', () => {});
        return conn;
      },
    } as unknown as typeof DynamoSQL;
    await testFunction(referenceClient, mysql_opts);
  });
  it(`${name} => dynamosql`, async function () {
    if (slow && !process.env.TEST_RUN_SLOW) {
      return this.skip();
    }
    await testFunction(DynamoSQL, {
      namespace: testNamespace(),
      decimalNumbers: true,
    });
  });
}
