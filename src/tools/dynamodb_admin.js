const asyncForever = require('async/forever');
const { ListTablesCommand } = require('@aws-sdk/client-dynamodb');

exports.init = init;
exports.getTableList = getTableList;

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
