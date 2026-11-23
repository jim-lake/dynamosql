'use strict';

var node_events = require('node:events');
var dynamosql_js = require('./dynamosql.js');

class Pool extends node_events.EventEmitter {
  config;
  escape = dynamosql_js.escape;
  escapeId = dynamosql_js.escapeId;
  format = dynamosql_js.format;
  constructor(args) {
    super();
    this.config = args;
  }
  end(done) {
    done?.();
  }
  getConnection(done) {
    done(null, dynamosql_js.createSession(this.config));
  }
  query(params, values, done) {
    if (typeof values === "function") {
      done = values;
      values = void 0;
    }
    const opts = typeof params === "string" ? { sql: params } : { ...params };
    opts.collectResults = Boolean(done);
    const session = dynamosql_js.createSession(this.config);
    return session.query(
      opts,
      values,
      (error, results, fields) => {
        session.release();
        done?.(error, results, fields);
      }
    );
  }
}
const createConnection = dynamosql_js.createSession;
function createPool(args) {
  return new Pool(args ?? {});
}
const createPoolCluster = createPool;

Object.defineProperty(exports, "SQLError", {
  enumerable: true,
  get: function () { return dynamosql_js.SQLError; }
});
Object.defineProperty(exports, "Types", {
  enumerable: true,
  get: function () { return dynamosql_js.Types; }
});
Object.defineProperty(exports, "createSession", {
  enumerable: true,
  get: function () { return dynamosql_js.createSession; }
});
Object.defineProperty(exports, "escape", {
  enumerable: true,
  get: function () { return dynamosql_js.escape; }
});
Object.defineProperty(exports, "escapeId", {
  enumerable: true,
  get: function () { return dynamosql_js.escapeId; }
});
Object.defineProperty(exports, "format", {
  enumerable: true,
  get: function () { return dynamosql_js.format; }
});
Object.defineProperty(exports, "raw", {
  enumerable: true,
  get: function () { return dynamosql_js.raw; }
});
exports.Pool = Pool;
exports.createConnection = createConnection;
exports.createPool = createPool;
exports.createPoolCluster = createPoolCluster;
//# sourceMappingURL=callbacks.js.map
