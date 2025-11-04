const ddl = require('./ddl');
const delete_opts = require('./delete');
const insert = require('./insert');
const select = require('./select');
const update = require('./update');

const Storage = require('./storage');

Object.assign(exports, ddl);
Object.assign(exports, delete_opts);
Object.assign(exports, insert);
Object.assign(exports, select);
Object.assign(exports, update);

exports.commit = commit;
exports.rollback = rollback;

function commit(params, done) {
  const { session, data } = params;
  for (let key in data) {
    const { database, table, data: tx_data } = data[key];
    Storage.updateTableData(database, table, session, tx_data);
  }
  done();
}
function rollback(params, done) {
  done();
}
