import asyncEach from 'async/each';
import asyncSeries from 'async/series';
import * as Engine from './engine';

export { run, startTransaction, commit, rollback };

class Transaction {
  _dataMap = new Map();
  _isAutoCommit: boolean;

  constructor(auto_commit: any) {
    this._isAutoCommit = Boolean(auto_commit);
  }

  isAutoCommit() {
    return this._isAutoCommit;
  }

  getEngineNameList() {
    return this._dataMap.keys();
  }

  getData(name: string) {
    return this._dataMap.get(name);
  }

  setData(name: string, data: any) {
    this._dataMap.set(name, data);
  }
}

function run(params: any, done: any) {
  const { dynamodb, session, func } = params;
  let tx: any;
  let func_err: any;
  let result_list: any[] = [];
  asyncSeries(
    [
      (done: any) => startTransaction({ session, auto_commit: true }, done),
      (done: any) => {
        tx = session.getTransaction();
        params.transaction = tx;
        func(params, (err: any, ...results: any[]) => {
          func_err = err;
          result_list = results;
          done();
        });
      },
      (done: any) => {
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
    (err: any) => done(func_err || err, ...result_list)
  );
}

function startTransaction(params: any, done: any) {
  const { session, auto_commit } = params;
  const existing = session.getTransaction();
  if (!existing) {
    const tx = new Transaction(auto_commit);
    session.setTransaction(tx);
  }
  done();
}

function commit(params: any, done: any) {
  _txEach(
    params,
    ({ engine, ...other }: any, done: any) => engine.commit(other, done),
    done
  );
}

function rollback(params: any, done: any) {
  _txEach(
    params,
    ({ engine, ...other }: any, done: any) => engine.rollback(other, done),
    done
  );
}

function _txEach(params: any, callback: any, done: any) {
  const { dynamodb, session } = params;
  const transaction = session.getTransaction();
  if (transaction) {
    const list = transaction.getEngineNameList();
    asyncEach(
      list,
      (name: string, done: any) => {
        const engine = Engine.getEngineByName(name);
        const data = transaction.getData(name);
        callback({ engine, dynamodb, session, transaction, data }, done);
      },
      (err: any) => {
        session.setTransaction(null);
        done(err);
      }
    );
  } else {
    done();
  }
}
