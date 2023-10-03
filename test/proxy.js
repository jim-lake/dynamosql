const mysql = require('mysql2');
const config = require('../config');

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3306;
const server = mysql.createServer();
server.listen(PORT);
console.log('mysql-proxy server listening:', PORT);

server.on('connection', (conn) => {
  console.log('server: new connection');

  const remote = mysql.createConnection(config.db);
  remote.connect((err) => {
    console.log('client: connect: err:', err);
    if (err) {
      console.log('client: connect: err:', err);
      conn.close();
    } else {
      conn.serverHandshake({
        protocolVersion: 10,
        serverVersion: '5.6.11',
        connectionId: 1234,
        statusFlags: 2,
        characterSet: 8,
        capabilityFlags: 2181036031,
      });
    }
  });
  remote.on('handshake', (handshake) => {
    console.log('client: handshake:', handshake);
  });
  conn.on('packet', (packet, known_command, cmd_code) => {
    console.log('client: packet:', packet, known_command, cmd_code);
  });

  conn.on('field_list', (table, fields) => {
    console.log('server: field_list:', table, fields);
    conn.writeEof();
  });
  conn.on('query', (sql) => {
    console.log('server: query:', sql);
    remote.query(sql, (err, result, columns) => {
      console.log('client: query:', err, result, columns);
      if (Array.isArray(result)) {
        console.log('rows', result);
        console.log('columns', columns);
        conn.writeTextResult(result, columns);
      } else {
        console.log('result', result);
        conn.writeOk(result);
      }
    });
  });
  conn.on('error', (err) => {
    console.log('server: error:', err);
  });
  conn.on('end', () => {
    console.log('server: end');
    remote.end();
  });
});
