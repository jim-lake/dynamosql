const asyncEach = require('async/each');
const asyncSeries = require('async/series');

const Engine = require('./engine');

exports.run = run;
exports.startTransaction = startTransaction;
exports.commit = commit;
exports.rollback = rollback;

class Transaction {
  constructor(auto_commit) {
    this._isAutoCommit = Boolean(auto_commit);
  }
  _dataMap = new Map();
  isAutoCommit() {
    return this._isAutoCommit;
  }
  getEngineNameList() {
    return this._dataMap.keys();
  }
  getData(name) {
    return this._dataMap.get(name);
  }
  setData(name, data) {
    this._dataMap.set(name, data);
  }
}

function run(params, done) {
  const { dynamodb, session, func } = params;
  let tx;
  let func_err;
  let result_list = [];
  asyncSeries(
    [
      (done) => startTransaction({ session, auto_commit: true }, done),
      (done) => {
        tx = session.getTransaction();
        params.transaction = tx;
        func(params, (err, ...results) => {
          func_err = err;
          result_list = results;
          done();
        });
      },
      (done) => {
        if (tx.isAutoCommit()) {
          if (func_err) {
            rollback({ dynamodb, session }, done);
          } else {
            commit({ dynamodb, session }, done);
          }
        } else {
          done();
        }
      },
    ],
    (err) => done(func_err || err, ...result_list)
  );
}
function startTransaction(params, done) {
  const { session, auto_commit } = params;
  const existing = session.getTransaction();
  if (!existing) {
    const tx = new Transaction(auto_commit);
    session.setTransaction(tx);
  }
  done();
}
function commit(params, done) {
  _txEach(
    params,
    ({ engine, ...other }, done) => engine.commit(other, done),
    done
  );
}
function rollback(params, done) {
  _txEach(
    params,
    ({ engine, ...other }, done) => engine.rollback(other, done),
    done
  );
}
function _txEach(params, callback, done) {
  const { dynamodb, session } = params;
  const transaction = session.getTransaction();
  if (transaction) {
    const list = transaction.getEngineNameList();
    asyncEach(
      list,
      (name, done) => {
        const engine = Engine.getEngineByName(name);
        const data = transaction.getData(name);
        callback({ engine, dynamodb, session, transaction, data }, done);
      },
      (err) => {
        session.setTransaction(null);
        done(err);
      }
    );
  } else {
    done();
  }
}
