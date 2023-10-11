const ddl = require('./ddl');
const delete_opts = require('./delete');
const insert = require('./insert');
const select = require('./select');

Object.assign(exports, ddl);
Object.assign(exports, delete_opts);
Object.assign(exports, insert);
Object.assign(exports, select);

exports.startTransaction = startTransaction;
exports.commit = commit;
exports.rollback = rollback;

function startTransaction(params, done) {
  const auto_commit = Boolean(params?.auto_commit);
  if (auto_commit) {
    done(null, { auto_commit });
  } else {
    done('unsupported');
  }
}
function commit(params, done) {
  done();
}
function rollback(params, done) {
  done();
}
