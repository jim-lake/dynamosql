exports.getTableList = unsupported;
exports.getRowList = unsupported;
exports.createTable = unsupported;
exports.dropTable = unsupported;
exports.startTransaction = unsupported;
exports.commit = unsupported;
exports.rollback = unsupported;

function unsupported(arg, done) {
  done('unsupported');
}
