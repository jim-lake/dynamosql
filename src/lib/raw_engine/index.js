const ddl = require('./ddl');
const delete_opts = require('./delete');
const logger = require('../../tools/logger');
const {
  escapeValue,
  escapeIdentifier,
  convertError,
} = require('../../tools/dynamodb_helper');

Object.assign(exports, ddl);
Object.assign(exports, delete_opts);

exports.getRowList = getRowList;
exports.insertRowList = insertRowList;
exports.startTransaction = startTransaction;
exports.commit = commit;
exports.rollback = rollback;

function getRowList(params, done) {
  const { dynamodb, table, request_set, request_all } = params;

  const request_columns = [...request_set];
  const columns = request_all
    ? '*'
    : request_columns.map(escapeIdentifier).join(',');
  const sql = `SELECT ${columns} FROM ${escapeIdentifier(table)}`;

  dynamodb.queryQL(sql, (err, results) => {
    let column_list;
    if (err) {
      logger.error('raw_engine.getRowList err:', err, results, sql);
    } else {
      if (request_all) {
        const response_set = new Set();
        results.forEach((result) => {
          for (let key in result) {
            response_set.add(key);
          }
        });
        column_list = [...response_set.keys()];
      } else {
        column_list = request_columns;
      }
    }
    done(err, results, column_list);
  });
}
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
