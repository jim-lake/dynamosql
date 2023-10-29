process.env.TZ = 'UTC';

const async = require('async');
const mysql = require('mysql');
const config = require('../config');
const { TYPES_MAP } = require('../src/constants/mysql');

const host = process.argv[2];
const port = parseInt(process.argv[3]);
const sql_list = process.argv.slice(4);

console.log('sql_list:', sql_list);

const conn = mysql.createConnection({
  host,
  port,
  user: config.db.user,
  password: config.db.password,
  //database: config.db.database,
  //debug: true,
  multipleStatements: true,
  dateStrings: true,
});
conn.connect((err) => {
  if (err) {
    console.log('connect: err:', err);
    process.exit(-1);
  } else {
    console.log('connect: success');
    async.eachSeries(
      sql_list,
      (sql, done) => {
        _query(sql, () => {
          done();
        });
      },
      () => {
        process.exit(0);
      }
    );
  }
});
conn.on('handshake', (handshake) => {
  console.log('handshake:', handshake);
});

function _query(sql, done) {
  console.log('sql:', sql);
  conn.query({ sql, nestTables: true }, (err, results, fields) => {
    const result0 = results?.[0];
    const val = result0?.fieldCount ?? result0?.length;
    if (val !== undefined) {
      for (let i = 0; i < results.length; i++) {
        console.log('result set:', i);
        fields?.[i]?.forEach?.((field, j) => {
          console.log('  field:', j, _convertField(field));
        });
        console.log('  results:', results?.[i]);
      }
    } else {
      fields?.forEach?.((field, i) => {
        console.log('field:', i, _convertField(field));
      });
      console.log('  results:', results);
    }
    if (err) {
      console.log('err:', err);
    }
    done();
  });
}

function _convertField(field) {
  let ret;
  if (field?.catalog) {
    const type_name = (TYPES_MAP[field.type] || '??') + ' (' + field.type + ')';
    ret = {
      catalog: field.catalog,
      db: field.db,
      schema: field.db,
      table: field.table,
      orgTable: field.orgTable,
      name: field.name,
      orgName: field.orgName,
      characterSet: field.charsetNr,
      columnLength: field.length,
      columnType: type_name,
      flags: '0x' + field.flags?.toString(16),
      decimals: field.decimals,
    };
  } else {
    ret = field;
  }
  return ret;
}
