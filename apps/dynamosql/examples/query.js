const path = require('node:path');
const dynamosql = require('..');

const sql = process.argv.slice(2).join(' ');
if (!sql) {
  console.log('usage:', path.basename(process.argv[1]), '<sql>');
  process.exit(-1);
}
console.log('sql:', sql);

// AWS_REGION and AWS credentials are read from the environment (.env via
// dotenv-cli, or the AWS SDK default chain).
const opts = {
  multipleStatements: true,
  region: process.env.AWS_REGION,
  namespace: process.env.DYNAMO_NAMESPACE ?? 'dynamosql_test',
};

const session = dynamosql.createSession(opts);
if (!session) {
  console.error('failed to init session');
  process.exit(-2);
}
session.query(sql, (err, results, fields) => {
  if (err) {
    console.log('err:', err);
  }
  if (fields) {
    console.log('fields:', fields);
  }
  if (results) {
    console.log('results:', results);
  }
  process.exit(err ? 1 : 0);
});
