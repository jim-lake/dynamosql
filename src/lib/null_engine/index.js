exports.getTableList = unsupported;
exports.getRowList = unsupported;
exports.createTable = unsupported;
exports.createIndex = unsupported;
exports.deleteIndex = unsupported;
exports.addColumn = unsupported;
exports.dropTable = unsupported;
exports.startTransaction = unsupported;
exports.commit = unsupported;
exports.rollback = unsupported;
exports.deleteRowList = unsupported;
exports.updateRowList = unsupported;
exports.replaceRowList = unsupported;

function unsupported(arg, done) {
  done('unsupported');
}
