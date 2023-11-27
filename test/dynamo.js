const dynamodb = require('../src/tools/dynamodb');
const util = require('node:util');

dynamodb.init({});

const sql_list = process.argv.slice(2);

console.log('sql_list:', sql_list);
dynamodb.transactionQL(sql_list, (err, results) => {
  console.log(err, util.inspect(results, { depth: 99 }));
});
