const ddl = require('./ddl');
const insert = require('./insert');
const select = require('./select');

const Storage = require('./storage');

Object.assign(exports, ddl);
Object.assign(exports, insert);
Object.assign(exports, select);

exports.commit = commit;
exports.rollback = rollback;

function commit(params, done) {
  const { data, session } = params;
  for (let key in data) {
    const { database, table, row_list } = data[key];
    Storage.saveRowList(database, table, session, row_list);
  }
  done();
}
function rollback(params, done) {
  done();
}
