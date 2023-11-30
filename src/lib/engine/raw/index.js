const ddl = require('./ddl');
const delete_opts = require('./delete');
const insert = require('./insert');
const replace = require('./replace');
const select = require('./select');
const update = require('./update');

Object.assign(exports, ddl);
Object.assign(exports, delete_opts);
Object.assign(exports, insert);
Object.assign(exports, replace);
Object.assign(exports, select);
Object.assign(exports, update);

exports.commit = commit;
exports.rollback = rollback;

function commit(params, done) {
  done();
}
function rollback(params, done) {
  done();
}
