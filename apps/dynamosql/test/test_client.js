process.env.TZ = 'UTC';

const mysql = require('mysql');
const config = require('../../../config');

const sql = process.argv.pop();
const arg_len = process.argv.length;
console.log('Arg_len:', arg_len);
const host = arg_len > 3 ? process.argv[2] : config.db?.host;
const port = parseInt(
  arg_len > 4 ? process.argv[3] : (config.db?.port ?? 3306)
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
  user: config.db.user,
  password: config.db.password,
  //database: config.db.database,
  //debug: true,
  //multipleStatements: true,
  dateStrings: true,
});
conn.connect((err) => {
  if (err) {
    console.log('connect: err:', err);
    process.exit(-1);
  } else {
    console.log('connect: success');
    conn.query(sql, [], (err, result, fields) => {
      console.log('err:', err);
      console.log('result:', result);
      console.log('fields:', fields);
      conn.destroy();
    });
  }
});
conn.on('handshake', (handshake) => {
  console.log('handshake:', handshake);
});
