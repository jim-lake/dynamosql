process.env.TZ = 'UTC';

const path = require('node:path');
const config = tryRequire('../config');
const dynamosql = require('../src');

const sql = process.argv.slice(2).join(' ');
if (!sql) {
  console.log('usage:', path.basename(process.argv[1]), '<sql>');
  process.exit(-1);
}
console.log('sql:', sql);

const opts = {
  multipleStatements: true,
  dateStrings: true,
  resultObjects: true,
};
if (config.region) {
  opts.region = config.region;
}
if (config.accessKeyId && config.secretAccessKey) {
  opts.credentials = {
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  };
}

const session = dynamosql.createSession(opts);
if (!session) {
  console.error('failed to init session');
  process.exit(-2);
}
session.query({ sql, nestTables: true }, (err, results, fields) => {
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

function tryRequire(path) {
  try {
    return require(path);
  } catch (e) {
    return {};
  }
}
