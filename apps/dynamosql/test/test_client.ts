export {};
process.env.TZ = 'UTC';

const mysql = require('mysql');
const { Types } = require('../src/types');
const { COLLATIONS, FIELD_FLAGS } = require('../src/constants/mysql');

const sql = process.argv.pop()!;
const arg_len = process.argv.length;
console.log('Arg_len:', arg_len);
const host =
  arg_len > 3 ? process.argv[2]! : (process.env.DB_HOST ?? 'localhost');
const port = parseInt(
  arg_len > 4 ? process.argv[3]! : (process.env.DB_PORT ?? '3306')
);
console.log('host:', host);
console.log('port:', port);
console.log('sql:', sql);

if (!sql || !host || !port) {
  console.log(`usage: ${process.argv[0]} [host] [port] <sql>`);
  process.exit(-1);
}

const conn = mysql.createConnection({
  host,
  port,
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  //database: config.db.database,
  //debug: true,
  charset: 'utf8mb4',
  multipleStatements: true,
  dateStrings: true,
  typeCast(field: any, next: () => any) {
    if (field.type === 'LONGLONG') {
      const val = field.string();
      if (val === null) {
        return null;
      }
      return BigInt(val);
    }
    return next();
  },
});
conn.connect((err: any) => {
  if (err) {
    console.log('connect: err:', err);
    process.exit(-1);
  } else {
    console.log('connect: success');
    conn.query(sql, [], (err: any, result: any, fields: any) => {
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
      console.log('err:', err);
      console.log('fields:', fields);
      console.log('result:', result);
      conn.destroy();
    });
  }
});
conn.on('handshake', (handshake: unknown) => {
  console.log('handshake:', handshake);
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
