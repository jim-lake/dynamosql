const asyncSeries = require('async/series');
const mysql = require('mysql2');
const MYSQL = require('../src/constants/mysql');
const { DEPRECATE_EOF } = MYSQL.CLIENT_FLAGS;
const { SERVER_MORE_RESULTS_EXISTS } = MYSQL.SERVER_STATUS;
const logger = require('./tools/logger');

const Session = require('./session');

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3306;
const server = mysql.createServer();

let g_connectionId = 1;

server.on('connection', _onConnection);

asyncSeries([(done) => Session.init({}, done)], (err) => {
  if (err) {
    logger.debug('mysql init failed:', err);
    process.exit(-1);
  } else {
    server.listen(PORT);
    logger.info('mysql server listening:', PORT);
  }
});

function _onConnection(conn) {
  logger.trace('server: new connection');

  const session = Session.newSession();

  function authenticate(params, done) {
    const flags = params?.clientHelloReply?.clientFlags;
    conn.DEPRECATE_EOF = Boolean(flags & DEPRECATE_EOF);
    if (params.database) {
      session.setCurrentDatabase(params.database);
    }
    conn.current_database = params.database;
    done(null, null, { serverStatus: 0x2 });
  }

  conn.serverHandshake({
    protocolVersion: 10,
    serverVersion: '8.0.0-dynamosql',
    connectionId: g_connectionId++,
    statusFlags: 2,
    characterSet: 255,
    capabilityFlags: 0x0fff31f | DEPRECATE_EOF,
    authCallback: authenticate,
  });
  //conn.on('packet', (...arg) => console.log('packet:', ...arg));
  conn.on('init_db', (database) => {
    logger.trace('init_db:', database);
    session.setCurrentDatabase(database, (err) => {
      if (err) {
        conn.writeError(_errorConvert(err));
      } else {
        conn.writeOk();
      }
    });
  });

  conn.on('field_list', (table, fields, ...other) => {
    logger.trace('server: field_list:', table, fields, ...other);
    conn.writeEof(undefined, undefined, true);
  });
  conn.on('query', (sql) => _query(sql, session, conn));
  conn.on('stmt_prepare', (sql) => _query(sql, session, conn));
  conn.on('stmt_execute', (_ignore1, _ignore2, _ignore3, _ignore4, sql) =>
    _query(sql, session, conn)
  );

  conn.on('error', (err) => {
    logger.error('server: error:', err);
  });
  conn.on('end', () => {
    logger.trace('server: end');
    conn.close();
  });
}

function _query(sql, session, conn) {
  logger.trace('sql:', sql);
  sql = _trim(sql);
  session.query(sql, (err, results, schemas, count) => {
    if (count > 1 && results.length > 0) {
      logger.trace('multi result:', count, results, schemas);
      for (let i = 0; i < results.length; i++) {
        const more_results = i < count - 1;
        _writeResult(conn, results[i], schemas[i], more_results);
      }
    }
    if (err) {
      logger.trace('err:', err);
      const { code, message } = _errorConvert(err);
      conn.writeError({ code, message });
    } else if (count === 1) {
      logger.trace('single result:', results, schemas);
      _writeResult(conn, results, schemas, false);
    }
  });
}
function _writeResult(conn, result, schema, more_results) {
  if (Array.isArray(result)) {
    conn.writeColumns(schema);
    _maybeEof(conn);
    result.forEach((row) => conn.writeTextRow(row));
    const status = more_results ? SERVER_MORE_RESULTS_EXISTS : 0;
    conn.writeEof(undefined, status, !more_results);
  } else {
    if (more_results) {
      result = result ? result : {};
      result.serverStatus = SERVER_MORE_RESULTS_EXISTS;
    }
    logger.trace('ok:', result);
    conn.writeOk(result, more_results);
  }
}

function _maybeEof(conn) {
  if (!conn.DEPRECATE_EOF) {
    conn.writeEof();
  }
}
function _trim(s) {
  let ret = s;
  if (s?.length > 2 && s.charCodeAt(1) < 0x20) {
    ret = s.slice(2);
  } else if (s?.length > 1 && s.charCodeAt(0) < 0x20) {
    ret = s.slice(1);
  }
  return ret;
}
function _errorConvert(err) {
  let ret;
  if (err === 'unsupported') {
    ret = { code: 1002, message: 'Unsupported' };
  } else if (err === 'parse') {
    ret = { code: 1064, message: 'Parse error' };
  } else if (err === 'no_current_database') {
    ret = { code: 1046, message: 'No database selected' };
  } else {
    ret = { code: err.code ?? 1002, message: err.message ?? String(err) };
  }
  return ret;
}
