const SqlString = require('sqlstring');
const Session = require('./session');

exports.createPool = createPool;

function createPool(args) {
  if (args) {
    Session.init(args);
  }
  return new Pool(args);
}
class Pool {
  constructor(args) {
    this._args = args;
  }
  _args;
  escape = SqlString.escape;
  escapeId = SqlString.escapeId;
  getConnection(done) {
    done(null, Session.createSession(this._args));
  }
  end(done) {
    done?.();
  }
}
