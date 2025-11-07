process.env.TZ = 'UTC';

const mysql = require('mysql');
const config = require('../../../config');

const host = process.argv[2];
const port = parseInt(process.argv[3]);

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
    conn.query('select 1; select 2;', [], (err, result, fields) => {
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
