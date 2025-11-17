process.env.TZ = 'UTC';

const path = require('node:path');
const config = tryRequire('../../../config');
const dynamosql = require('../src');
const { Types } = require('../src/types');
const { CHARSETS, FIELD_FLAGS } = require('../src/constants/mysql');

const sql = process.argv.slice(2).join(' ');
if (!sql) {
  console.log('usage:', path.basename(process.argv[1]), '<sql>');
  process.exit(-1);
}
console.log('sql:', sql);

const opts = {
  namespace: process.env.DYNAMO_NAMESPACE ?? '',
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
session.query({ sql }, (err, results, fields) => {
  if (err) {
    console.log('err:', err);
  }
  if (fields) {
    for (let field_list of fields ?? []) {
      if (!Array.isArray(field_list)) {
        field_list = [field_list];
      }
      for (const field of field_list) {
        if (typeof field === 'object') {
          field.charsetNr = `${field.charsetNr} (${CHARSETS[field.charsetNr]})`;
          field.type = `${field.type} (${Types[field.type]})`;
          field.flags = `0x${field.flags.toString(16)} (${flagsToString(FIELD_FLAGS, field.flags)})`;
        }
      }
    }
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
  } catch {
    return {};
  }
}
function flagsToString<T extends Record<string, number>>(
  enumObj: T,
  value: number
): string[] {
  return Object.keys(enumObj)
    .filter((k) => typeof enumObj[k] === 'number') // filter out reverse mapping (for numeric enums)
    .filter((k) => {
      const flag = enumObj[k] as unknown as number;
      return flag !== 0 && (value & flag) === flag;
    });
}
