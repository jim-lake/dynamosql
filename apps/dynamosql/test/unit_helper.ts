import * as mysql from 'mysql';
import * as DynamoSQL from '../src';

const dbConfig = {
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '3306'),
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
};

export function addUnitTest(
  name: string,
  testFunction: (lib: typeof mysql, config: any) => void | Promise<void>
) {
  it(`${name} => mysql`, async () => {
    const mysql_opts = {
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      multipleStatements: true,
      dateStrings: true,
    };
    await testFunction(mysql, mysql_opts);
  });
  it(`${name} => dynamosql`, async () => {
    await testFunction(DynamoSQL as unknown as typeof mysql, {
      namespace: process.env.DYNAMO_NAMESPACE ?? 'dynamosql_test',
    });
  });
}
