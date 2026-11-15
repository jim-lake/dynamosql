const mysql = require('mysql2');

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3306;
const COM_QUERY = 0x03;
const ER_UNSUPPORTED_PS = 1295;
const server = mysql.createServer();
server.listen(PORT);
console.log('mysql-proxy server listening:', PORT);

server.on('connection', (conn) => {
  console.log('server: new connection');
  let commandCode;

  const remote = mysql.createConnection({
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '3306'),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
  });
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
        capabilityFlags: 2181036031 - (1 << 24),
      });
    }
  });
  remote.on('handshake', (handshake) => {
    console.log('client: handshake:', handshake);
  });
  conn.on('packet', (packet, known_command, cmd_code) => {
    console.log('client: packet:', packet, known_command, cmd_code);
    commandCode = cmd_code;
  });

  function writeResult(err, result, columns) {
    console.log('client: query:', err, result, columns);
    if (err) {
      conn.writeError({
        code: err.errno,
        message: err.sqlMessage ?? err.message,
      });
    } else if (Array.isArray(result)) {
      conn.writeColumns(columns);
      conn.writeEof();
      result.forEach((row) =>
        conn.writeTextRow(columns.map((column) => row[column.name]))
      );
      conn.writeEof(undefined, undefined, true);
    } else {
      conn.writeOk(result);
    }
  }

  // mysql2 routes text-protocol SET, PREPARE and EXECUTE to the stmt_* events.
  // The 'packet' event fires after this handler returns, so the command code is read on the next tick.
  function forwardStatement(sql) {
    process.nextTick(() => {
      if (commandCode === COM_QUERY) {
        console.log('server: query:', sql);
        remote.query(sql, writeResult);
      } else {
        conn.writeError({
          code: ER_UNSUPPORTED_PS,
          message: 'Binary prepared statements are not supported by the proxy',
        });
      }
    });
  }

  conn.on('field_list', (table, fields) => {
    console.log('server: field_list:', table, fields);
    conn.writeEof();
  });
  conn.on('query', (sql) => {
    console.log('server: query:', sql);
    remote.query(sql, writeResult);
  });
  conn.on('stmt_prepare', forwardStatement);
  conn.on('stmt_execute', (stmtId, flags, iterationCount, values, sql) =>
    forwardStatement(sql)
  );
  conn.on('init_db', (database) =>
    remote.query(`USE ${mysql.escapeId(database)}`, writeResult)
  );
  conn.on('error', (err) => {
    console.log('server: error:', err);
  });
  conn.on('end', () => {
    console.log('server: end');
    remote.end();
  });
});
