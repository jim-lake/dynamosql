const asyncForever = require('async/forever');
const {
  CreateTableCommand,
  DeleteTableCommand,
  ListTablesCommand,
} = require('@aws-sdk/client-dynamodb');
const { convertError } = require('./dynamodb_helper');

exports.init = init;
exports.getTableList = getTableList;
exports.createTable = createTable;
exports.deleteTable = deleteTable;

let g_client;

function init(client) {
  g_client = client;
}
function getTableList(done) {
  const command = new ListTablesCommand({ Limit: 100 });
  let next_token;
  const results = [];
  asyncForever(
    (done) => {
      if (next_token) {
        command.input.ExclusiveStartTableName = next_token;
      }
      g_client.send(command).then((result) => {
        let err;
        result.TableNames.forEach((table) => results.push(table));
        next_token = result?.LastEvaluatedTableName;
        if (!next_token) {
          err = 'stop';
        }
        done(err);
      }, done);
    },
    (err) => {
      if (err === 'stop') {
        err = null;
      }
      done(err, results);
    }
  );
}
function createTable(params, done) {
  const { table, billing_mode, column_list, primary_key } = params;
  const AttributeDefinitions = column_list.map((column) => ({
    AttributeName: column.name,
    AttributeType: _dynamoType(column.type),
  }));
  const KeySchema = [
    {
      AttributeName: primary_key?.[0]?.name,
      KeyType: 'HASH',
    },
  ];
  if (primary_key?.[1]) {
    KeySchema.push({
      AttributeName: primary_key[1].name,
      KeyType: 'RANGE',
    });
  }

  const input = {
    TableName: table,
    BillingMode: billing_mode || 'PAY_PER_REQUEST',
    AttributeDefinitions,
    KeySchema,
  };
  const command = new CreateTableCommand(input);
  g_client.send(command).then(
    () => done(),
    (err) => done(convertError(err))
  );
}
function deleteTable(TableName, done) {
  const command = new DeleteTableCommand({ TableName });
  g_client.send(command).then(
    () => done(),
    (err) => done(convertError(err))
  );
}
function _dynamoType(type) {
  let ret = type;
  if (type === 'string') {
    ret = 'S';
  } else if (type === 'VARCHAR') {
    ret = 'S';
  } else if (type === 'INT') {
    ret = 'N';
  } else if (type === 'number') {
    ret = 'N';
  } else if (type === 'blob') {
    ret = 'B';
  }
  return ret;
}
