const asyncForever = require('async/forever');
const asyncTimesLimit = require('async/timesLimit');
const {
  DynamoDBClient,
  BatchExecuteStatementCommand,
  ExecuteStatementCommand,
  ExecuteTransactionCommand,
} = require('@aws-sdk/client-dynamodb');

const { init: AdminInit, ...AdminOther } = require('./dynamodb_admin');
const {
  pql,
  convertError,
  escapeIdentifier,
  escapeString,
} = require('./dynamodb_helper');

const QUERY_LIMIT = 5;

exports.init = init;
exports.pql = pql;
exports.queryQL = queryQL;
exports.batchQL = batchQL;
exports.transactionQL = transactionQL;
exports.deleteItems = deleteItems;
exports.updateItems = updateItems;
Object.assign(exports, AdminOther);

let g_client;

function init(params) {
  if (!params) {
    params = {};
  }
  if (!params.region && process.env.AWS_DEFAULT_REGION) {
    params.region = process.env.AWS_DEFAULT_REGION;
  }
  g_client = new DynamoDBClient(params);
  AdminInit(g_client);
}

function queryQL(list, done) {
  if (!Array.isArray(list)) {
    _queryQL(list, done);
  } else {
    const err_list = [];
    const result_list = [];
    asyncTimesLimit(
      list.length,
      QUERY_LIMIT,
      (i, done) => {
        const item = list[i];
        _queryQL(item, (err, result) => {
          result_list[i] = result;
          err_list[i] = err;
          done(err);
        });
      },
      (err) => done(err ? err_list : null, result_list)
    );
  }
}
function _queryQL(params, done) {
  const sql = params?.sql ? params.sql : params;
  const input = {
    Statement: sql,
    ReturnValuesOnConditionCheckFailure: params?.return ?? 'NONE',
  };
  const command = new ExecuteStatementCommand(input);
  _pagedSend(command, done);
}
function batchQL(params, done) {
  const list = Array.isArray(params) ? params : params.list;
  const input = {
    Statements: list.map((Statement) => ({
      Statement,
      ReturnValuesOnConditionCheckFailure: params?.return ?? 'NONE',
    })),
  };
  const command = new BatchExecuteStatementCommand(input);
  g_client.send(command).then(
    (result) => _successReturn(result, done),
    (err) => _errorReturn(err, done)
  );
}
function transactionQL(params, done) {
  const list = Array.isArray(params) ? params : params.list;
  const input = {
    TransactStatements: list.map((Statement) => ({
      Statement,
      ReturnValuesOnConditionCheckFailure: params?.return ?? 'NONE',
    })),
  };
  const command = new ExecuteTransactionCommand(input);
  g_client.send(command).then(
    (result) => _successReturn(result, done),
    (err) => _errorReturn(err, done)
  );
}
function deleteItems(params, done) {
  const BATCH_LIMIT = 100;
  const { table, key_list, list } = params;
  const batch_count = Math.ceil(list.length / BATCH_LIMIT);
  const prefix = `DELETE FROM ${escapeIdentifier(table)} WHERE `;
  const err_list = [];
  const result_list = [];
  asyncTimesLimit(
    batch_count,
    QUERY_LIMIT,
    (batch_index, done) => {
      const sql_list = [];
      const start = BATCH_LIMIT * batch_index;
      const end = Math.min(start + BATCH_LIMIT, list.length);
      for (let i = start; i < end; i++) {
        const cond = key_list
          .map((key, j) => {
            const value = list[i][j];
            return `${escapeIdentifier(key)} = ${_convertValueToPQL(value)}`;
          })
          .join(' AND ');
        sql_list.push(prefix + cond);
      }
      transactionQL(sql_list, (err, result) => {
        for (let i = start; i < end; i++) {
          result_list[i] = result?.[i - start];
          err_list[i] = err?.[i - start];
        }
        done(err);
      });
    },
    (err) => done(err ? err_list : null, result_list)
  );
}
function updateItems(params, done) {
  const BATCH_LIMIT = 100;
  const { table, key_list, list } = params;
  const batch_count = Math.ceil(list.length / BATCH_LIMIT);
  const prefix = `UPDATE ${escapeIdentifier(table)} SET `;
  const err_list = [];
  const result_list = [];
  asyncTimesLimit(
    batch_count,
    QUERY_LIMIT,
    (batch_index, done) => {
      const sql_list = [];
      const start = BATCH_LIMIT * batch_index;
      const end = Math.min(start + BATCH_LIMIT, list.length);
      for (let i = start; i < end; i++) {
        const item = list[i];
        const sets = item.set_list
          .map((object) => {
            const { column, value } = object;
            return `${escapeIdentifier(column)} = ${value}`;
          })
          .join(', ');
        const cond =
          ' WHERE ' +
          key_list
            .map((key, j) => {
              const value = item.key[j];
              return `${escapeIdentifier(key)} = ${_convertValueToPQL(value)}`;
            })
            .join(' AND ');
        sql_list.push(prefix + sets + cond);
      }
      transactionQL(sql_list, (err, result) => {
        for (let i = start; i < end; i++) {
          result_list[i] = result?.[i - start];
          err_list[i] = err?.[i - start];
        }
        done(err);
      });
    },
    (err) => done(err ? err_list : null, result_list)
  );
}
function _pagedSend(command, done) {
  let next_token;
  const results = [];
  asyncForever(
    (done) => {
      if (next_token) {
        command.input.NextToken = next_token;
      }
      g_client.send(command).then(
        (result) => {
          let [err, list] = _convertSuccess(result);
          list?.forEach?.((item) => {
            results.push(item);
          });

          next_token = result?.NextToken;
          if (!err && !next_token) {
            err = 'stop';
          }
          done(err);
        },
        (err) => {
          if (err.Item) {
            results.push(err.Item);
          }
          done(convertError(err));
        }
      );
    },
    (err) => {
      if (err === 'stop') {
        err = null;
      }
      done(err, results);
    }
  );
}
function _convertValueToPQL(value) {
  let ret;
  if (value.S !== undefined) {
    ret = "'" + escapeString(value.S) + "'";
  } else if (value.N !== undefined) {
    ret = value.N;
  } else {
    ret = "'" + escapeString(String(value)) + "'";
  }
  return ret;
}
function _successReturn(result, done) {
  done(..._convertSuccess(result));
}
function _errorReturn(err, done) {
  let ret;
  if (err.Item) {
    ret = [err.Item];
  }
  done(convertError(err), ret);
}
function _convertSuccess(result) {
  let err = null;
  let ret;
  if (result?.Responses) {
    ret = [];
    result.Responses.forEach((response, i) => {
      if (response.Error) {
        if (!err) {
          err = [];
        }
        err[i] = convertError(response.Error);
      }
      ret[i] = _convertResult(response);
    });
  } else {
    ret = _convertResult(result);
  }
  return [err, ret];
}
function _convertResult(result) {
  let ret;
  if (result?.Items) {
    ret = result.Items;
  } else if (result?.Item) {
    ret = [result?.Item];
  }
  return ret;
}
