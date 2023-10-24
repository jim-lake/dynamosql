const dynamodb = require('../src/tools/dynamodb');

dynamodb.init({});

const sql_list = [];
for (let i = 0; i < 100; i++) {
  sql_list.push(`SELECT * FROM "foo" WHERE "id" = '${i}'`);
}

console.log('sql_list:', sql_list);
dynamodb.transactionQL(sql_list, (err, results) => {
  console.log(err, results);
});
