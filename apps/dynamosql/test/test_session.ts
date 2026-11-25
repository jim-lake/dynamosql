export {};
process.env.TZ = 'UTC';

const path = require('node:path');
const dynamosql = require('../src/callbacks');
const { Types } = require('../src/types');
const { COLLATIONS, FIELD_FLAGS } = require('../src/constants/mysql');
const { testNamespace } = require('./test_namespace');

const args = process.argv.slice(2);
const decimalStrings = args.includes('--decimal-strings');
const sql = args.filter((arg) => arg !== '--decimal-strings').join(' ');
if (!sql) {
  console.log('usage:', path.basename(process.argv[1]), '<sql>');
  process.exit(-1);
}
console.log('sql:', sql);

const opts = {
  namespace: testNamespace(),
  multipleStatements: true,
  dateStrings: true,
  decimalNumbers: !decimalStrings,
  resultObjects: true,
  charset: 'utf8mb4',
  typeCast(field: any, next: () => any) {
    if (field.type === 'LONGLONG') {
      const val = field.string();
      if (val === null || val === undefined) {
        return null;
      }
      return BigInt(val);
    }
    return next();
  },
};

const session = dynamosql.createSession(opts);
if (!session) {
  console.error('failed to init session');
  process.exit(-2);
}
session.query({ sql }, (err: any, results: any, fields: any) => {
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
          field.charsetNr = `${field.charsetNr} (${COLLATIONS[field.charsetNr]})`;
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
