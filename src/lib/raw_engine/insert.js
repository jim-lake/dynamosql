const {
  escapeValue,
  escapeIdentifier,
  convertError,
} = require('../../tools/dynamodb_helper');

exports.insertRowList = insertRowList;

function insertRowList(params, done) {
  const { dynamodb, ignore_dup, table, list } = params;
  const sql_list = list.map(
    (item) =>
      `INSERT INTO ${escapeIdentifier(table)} VALUE ${escapeValue(item)}`
  );
  if (ignore_dup) {
    dynamodb.batchQL(sql_list, (err_list) => {
      let err;
      let affected_rows = 0;
      if (err_list?.length > 0) {
        affected_rows = list.length - err_list.length;
        err_list.forEach((item_err) => {
          if (item_err?.Code === 'DuplicateItem') {
            // ignore
          } else if (!err && item_err) {
            err = convertError(item_err);
          }
        });
      }
      done(err, affected_rows);
    });
  } else {
    dynamodb.transactionQL(sql_list, (err) => {
      if (
        err?.name === 'TransactionCanceledException' &&
        err.CancellationReasons
      ) {
        for (let i = 0; i < err.CancellationReasons.length; i++) {
          if (err.CancellationReasons[i].Code === 'DuplicateItem') {
            err = 'dup';
            break;
          }
        }
      }
      done(err, err ? 0 : list.length);
    });
  }
}
