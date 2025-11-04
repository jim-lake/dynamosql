const SqlString = require('sqlstring');
const Session = require('./session');

exports.createPool = createPool;

function createPool(args) {
  if (args) {
    Session.init(args);
  }
  return new Pool(args || {});
}
class Pool {
  constructor(args) {
    this._args = args;
  }
  _args;
  escape = SqlString.escape;
  escapeId = SqlString.escapeId;
  end(done) {
    done?.();
  }
  getSession(done) {
    done(null, Session.createSession(this._args));
  }
  query(opts, values, done) {
    if (typeof values === 'function') {
      done = values;
      values = undefined;
    }
    const session = Session.createSession(this._args);
    session.query(opts, values, (...result) => {
      session.release();
      done(...result);
    });
  }
}
