const asyncSeries = require('async/series');

exports.run = run;

function run(params, done) {
  const { session, engine, func } = params;

  let transaction;
  let func_err;
  let result_list = [];
  asyncSeries(
    [
      (done) => {
        transaction = session.getTransaction();
        if (transaction) {
          done();
        } else {
          engine.startTransaction({ auto_commit: true }, (err, tx) => {
            if (!err) {
              transaction = tx;
              transaction.auto_commit = true;
              session.setTransaction(transaction);
            }
            done(err);
          });
        }
      },
      (done) => {
        params.transaction = transaction;
        func(params, (err, ...results) => {
          func_err = err;
          result_list = results;
          done();
        });
      },
      (done) => {
        if (transaction.auto_commit) {
          if (func_err) {
            engine.rollback({ transaction }, done);
          } else {
            engine.commit({ transaction }, done);
          }
        } else {
          done();
        }
      },
    ],
    (err) => {
      if (transaction?.auto_commit) {
        session.setTransaction(null);
      }
      done(func_err || err, ...result_list);
    }
  );
}
