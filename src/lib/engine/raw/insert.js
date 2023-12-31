const asyncSeries = require('async/series');
const {
  escapeValue,
  escapeIdentifier,
  convertError,
} = require('../../../tools/dynamodb_helper');
const { trackFirstSeen } = require('../../../tools/util');

exports.insertRowList = insertRowList;

function insertRowList(params, done) {
  if (params.list.length === 0) {
    done(null, { affectedRows: 0 });
  } else if (params.duplicate_mode) {
    _insertIgnoreReplace(params, done);
  } else {
    _insertNoIgnore(params, done);
  }
}
function _insertIgnoreReplace(params, done) {
  const { dynamodb, duplicate_mode, table } = params;
  let list = params.list;
  let affectedRows;
  asyncSeries(
    [
      (done) => {
        if (list.length > 1) {
          dynamodb.getTableCached(table, (err, result) => {
            if (err === 'resource_not_found') {
              err = { err: 'table_not_found', args: [table] };
            } else if (!err) {
              const key_list = result.Table.KeySchema.map(
                (k) => k.AttributeName
              );
              const track = new Map();
              if (duplicate_mode === 'replace') {
                list.reverse();
              }
              list = list.filter((row) =>
                trackFirstSeen(
                  track,
                  key_list.map((key) => row[key].value)
                )
              );
              if (duplicate_mode === 'replace') {
                list.reverse();
              }
            }
            done(err);
          });
        } else {
          done();
        }
      },
      (done) => {
        if (duplicate_mode === 'ignore') {
          affectedRows = list.length;
          const sql_list = list.map(
            (item) =>
              `INSERT INTO ${escapeIdentifier(table)} VALUE ${_escapeItem(
                item
              )}`
          );
          dynamodb.batchQL(sql_list, (err_list) => {
            let err;
            if (err_list?.length > 0) {
              err_list.forEach((item_err) => {
                if (item_err?.Code === 'DuplicateItem') {
                  affectedRows--;
                } else if (!err && item_err) {
                  affectedRows--;
                  err = convertError(item_err, { table });
                }
              });
            } else if (err_list?.name === 'ValidationException') {
              err = {
                err: 'dup_table_insert',
                sqlMessage: err_list.message,
                cause: err_list,
              };
            } else if (err_list) {
              err = err_list;
            }
            done(err);
          });
        } else {
          list.forEach(_fixupItem);
          const opts = {
            table,
            list,
          };
          dynamodb.putItems(opts, (err) => {
            if (err) {
              err = convertError(err);
            }
            done(err, err ? undefined : { affectedRows: list.length });
          });
        }
      },
    ],
    (err) => done(err, err ? undefined : { affectedRows })
  );
}
function _insertNoIgnore(params, done) {
  const { dynamodb, table, list } = params;
  const sql_list = list.map(
    (item) =>
      `INSERT INTO ${escapeIdentifier(table)} VALUE ${_escapeItem(item)}`
  );
  dynamodb.transactionQL(sql_list, (err) => {
    if (
      err?.name === 'TransactionCanceledException' &&
      err.CancellationReasons
    ) {
      for (let i = 0; i < err.CancellationReasons.length; i++) {
        if (err.CancellationReasons[i].Code === 'DuplicateItem') {
          err = {
            err: 'dup_table_insert',
            args: [table, _fixupItem(list[i])],
          };
          break;
        } else if (err.CancellationReasons[i].Code !== 'None') {
          err = {
            err: convertError(err.CancellationReasons[i]),
            message: err.CancellationReasons[i].Message,
          };
          break;
        }
      }
    } else if (err?.name === 'ValidationException') {
      err = {
        err: 'dup_table_insert',
        sqlMessage: err.message,
        cause: err,
      };
    } else if (err) {
      err = convertError(err);
    }
    done(err, err ? undefined : { affectedRows: list.length });
  });
}
function _fixupItem(item) {
  for (let key in item) {
    item[key] = item[key].value;
  }
  return item;
}
function _escapeItem(item) {
  let s = '{ ';
  s += Object.keys(item)
    .map((key) => `'${key}': ${escapeValue(item[key].value)}`)
    .join(', ');
  s += ' }';
  return s;
}
