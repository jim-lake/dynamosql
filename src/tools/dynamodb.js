const asyncForever = require('async/forever');
const asyncEachLimit = require('async/eachLimit');
const asyncTimesLimit = require('async/timesLimit');
const {
  DynamoDBClient,
  BatchExecuteStatementCommand,
  BatchWriteItemCommand,
  ExecuteStatementCommand,
  ExecuteTransactionCommand,
  TransactWriteItemsCommand,
  UpdateItemCommand,
} = require('@aws-sdk/client-dynamodb');

const { init: AdminInit, ...AdminOther } = require('./dynamodb_admin');

const BATCH_LIMIT = 5;
const QUERY_LIMIT = 5;

exports.escapeIdentifier = escapeIdentifier;
exports.escapeString = escapeString;
exports.escapeValue = escapeValue;
exports.init = init;
exports.pql = pql;
exports.queryQL = queryQL;
exports.batchQL = batchQL;
exports.transactionQL = transactionQL;
exports.batchWrite = batchWrite;
exports.update = update;
exports.transaction = transaction;
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
function escapeIdentifier(string) {
  return '"' + string + '"';
}
function escapeString(string) {
  let ret = '';
  for (let i = 0; i < string.length; i++) {
    const c = string.charCodeAt(i);
    if (c < 32) {
      ret += '\\x' + c.toString(16);
    } else if (c === 39) {
      ret += "''";
    } else {
      ret += string[i];
    }
  }
  return ret;
}
function escapeValue(value) {
  let s;
  if (value === null) {
    s = 'NULL';
  } else if (Array.isArray(value)) {
    s = '[ ';
    s += value.map(escapeValue).join(', ');
    s += ' ]';
  } else if (typeof value === 'object') {
    s = '{ ';
    s += Object.keys(value)
      .map((key) => `'${key}': ${escapeValue(value[key])}`)
      .join(', ');
    s += ' }';
  } else if (typeof value === 'number') {
    s = String(value);
  } else if (value !== undefined) {
    s = "'" + escapeString(String(value)) + "'";
  } else {
    s = 'MISSING';
  }
  return s;
}
function pql(strings, ...values) {
  let s = '';
  for (let i = 0; i < strings.length; i++) {
    s += strings[i];
    if (i < values.length) {
      s += escapeValue(values[i]);
    }
  }
  s = s.replace(/\s+/g, ' ').trim();
  return s;
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
        const sql = list[i];
        _queryQL(sql, (err, result) => {
          result_list[i] = result;
          err_list[i] = err;
          done(err);
        });
      },
      (err) => done(err ? err_list : null, result_list)
    );
  }
}
function _queryQL(sql, done) {
  const input = {
    Statement: sql,
    ReturnValuesOnConditionCheckFailure: 'ALL_OLD',
  };
  const command = new ExecuteStatementCommand(input);
  _pagedSend(command, done);
}
function batchQL(list, done) {
  const input = {
    Statements: list.map((Statement) => ({
      Statement,
      ReturnValuesOnConditionCheckFailure: 'ALL_OLD',
    })),
  };
  const command = new BatchExecuteStatementCommand(input);
  _pagedSend(command, done);
}
function transactionQL(list, done) {
  const input = {
    TransactStatements: list.map((Statement) => ({
      Statement,
      ReturnValuesOnConditionCheckFailure: 'ALL_OLD',
    })),
  };
  const command = new ExecuteTransactionCommand(input);
  g_client.send(command).then(
    (result) => _successReturn(result, done),
    (err) => _errorReturn(err, done)
  );
}
function update(opts, done) {
  const cmd = _inputUpdate(opts);
  g_client.send(new UpdateItemCommand(cmd)).then(
    (result) => _successReturn(result, done),
    (err) => _errorReturn(err, done)
  );
}
function batchWrite(list, done) {
  const MAX_REQUEST_ITEMS = 25;
  const batch_list = [];
  for (let i = 0; i < list.length; i += MAX_REQUEST_ITEMS) {
    batch_list.push(list.slice(i, i + MAX_REQUEST_ITEMS));
  }
  const results = [];
  asyncEachLimit(
    batch_list,
    BATCH_LIMIT,
    (batch, done) => {
      const cmd = {
        RequestItems: {},
      };
      batch.forEach((write) => {
        const { table, item } = write;
        if (!cmd.RequestItems[table]) {
          cmd.RequestItems[table] = [];
        }
        cmd.RequestItems[table].push(_inputPut(item));
      });
      g_client.send(new BatchWriteItemCommand(cmd)).then(
        (result) => {
          let [err, success_list] = _convertSuccess(result);
          success_list?.forEach?.((item) => {
            results.push(item);
          });
          done(err);
        },
        (err) => {
          if (err.Item) {
            results.push(err.Item);
          }
          done(_convertError(err));
        }
      );
    },
    (err) => done(err, results)
  );
}
function transaction(list, done) {
  const TransactItems = list.map((item) => {
    return { Update: _inputUpdate(item) };
  });
  const cmd = { TransactItems };
  g_client.send(new TransactWriteItemsCommand(cmd)).then(
    (result) => _successReturn(result, done),
    (err) => _errorReturn(err, done)
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
          done(_convertError(err));
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

function _successReturn(result, done) {
  done(..._convertSuccess(result));
}
function _errorReturn(err, done) {
  let ret;
  if (err.Item) {
    ret = [err.Item];
  }
  done(_convertError(err), ret);
}
function _inputUpdate(opts) {
  const sets = [];
  const values = {};
  _inputSetAttrib(sets, values, opts.updates);
  if (opts.expression_values) {
    _inputSetAttrib([], values, opts.expression_values);
  }

  const ret = {
    TableName: opts.table,
    Key: _inputObject(opts.key),
    UpdateExpression: 'SET ' + sets.join(', '),
    ExpressionAttributeValues: values,
    ReturnValues: 'ALL_NEW',
    ReturnValuesOnConditionCheckFailure: 'ALL_OLD',
  };
  if (opts.condition) {
    ret.ConditionExpression = opts.condition;
  }
  return ret;
}
function _inputPut(opts) {
  return {
    PutRequest: {
      Item: _inputObject(opts),
    },
  };
}
function _inputObject(obj) {
  const ret = {};
  Object.keys(obj).forEach((key) => {
    ret[key] = _inputValue(obj[key]);
  });
  return ret;
}
function _inputValue(value) {
  let ret;
  if (typeof value === 'number') {
    ret = { N: String(value) };
  } else if (Buffer.isBuffer(value)) {
    ret = { B: value };
  } else if (typeof value === 'boolean') {
    ret = { BOOL: value };
  } else {
    ret = { S: String(value) };
  }
  return ret;
}
function _inputSetAttrib(sets, values, obj) {
  Object.keys(obj).forEach((key) => {
    sets.push(`${key} = :${key}`);
    values[':' + key] = _inputValue(obj[key]);
  });
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
        err[i] = _convertError(response.Error);
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
function _convertError(err) {
  let ret = err;
  if (err.name === 'ConditionalCheckFailedException' && err.Item) {
    ret = 'cond_fail';
  } else if (err.Code === 'ConditionalCheckFailed') {
    ret = 'cond_fail';
  }
  return ret;
}
