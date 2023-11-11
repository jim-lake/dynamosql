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
      let affectedRows = list.length;
      if (err_list?.length > 0) {
        err_list.forEach((item_err) => {
          if (item_err?.Code === 'DuplicateItem') {
            affectedRows--;
          } else if (!err && item_err) {
            affectedRows--;
            err = convertError(item_err, { table });
          }
        });
      } else {
        affectedRows = list.length;
      }
      done(err, err ? undefined : { affectedRows } );
    });
  } else {
    dynamodb.transactionQL(sql_list, (err) => {
      if (
        err?.name === 'TransactionCanceledException' &&
        err.CancellationReasons
      ) {
        for (let i = 0; i < err.CancellationReasons.length; i++) {
          if (err.CancellationReasons[i].Code === 'DuplicateItem') {
            err = {
              err: 'dup_table_insert',
              args: [table, list[i]],
            };
            break;
          } else if (err.CancellationReasons[i].Code !== 'None') {
            err = {
              err: convertError(err.CancellationReasons[i]),
            };
            if (err.err === 'table_not_found') {
              err.args = [table];
            }
            break;
          }
        }
      } else if (err) {
        err = convertError(err);
      }
      done(err, err ? undefined : { affectedRows: list.length });
    });
  }
}
