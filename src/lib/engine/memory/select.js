const Storage = require('./storage');

exports.getRowList = getRowList;

function getRowList(params, done) {
  const { list } = params;

  let err;
  const source_map = {};
  const column_map = {};
  list.forEach((from) => {
    const result = _getFromTable({ ...params, from });
    if (!err && result.err) {
      err = result.err;
    }
    source_map[from.key] = result.row_list;
    column_map[from.key] = result.column_list;
  });
  done(err, source_map, column_map);
}
function _getFromTable(params) {
  const { session } = params;
  const { db, table } = params.from;
  const data = Storage.getTable(db, table, session);
  return {
    err: data ? null : 'table_not_found',
    row_list: data?.row_list,
    column_list: data?.column_list?.map?.((column) => column.name) || [],
  };
}
