import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import * as mysql from 'mysql';
import * as DynamoSQL from '../src';

const config = JSON.parse(
  readFileSync(join(__dirname, '../../../config.json'), 'utf8')
);

export function addUnitTest(
  t: typeof test,
  name: string,
  testFunction: (lib: typeof mysql, config: any) => void | Promise<void>
) {
  it(`${name} => mysql`, async () => {
    const mysql_opts = {
      host: config.db.host,
      port: config.db.port ?? 3306,
      user: config.db.user,
      password: config.db.password,
      //database: config.db.database,
      multipleStatements: true,
      dateStrings: true,
    };
    await testFunction(mysql, mysql_opts);
  });
  it(`${name} => dynamosql`, async () => {
    await testFunction(DynamoSQL as unknown as typeof mysql, {
      namespace: process.env.DYNAMO_NAMESPACE ?? '',
    });
  });
}
