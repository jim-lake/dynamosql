const path = require('node:path');
const { Parser } = require('node-sql-parser/build/mysql');

const sql = process.argv.slice(2).join(' ');
if (!sql) {
  console.log('usage:', path.basename(process.argv[1]), '<sql>');
  process.exit(-1);
}
console.log('sql:', sql);

const parser = new Parser();
try {
  const ast = parser.astify(sql, { database: 'MySQL' });
  console.log(JSON.stringify(ast, null, 2));
} catch (e) {
  console.log('parse error:', e instanceof Error ? e.message : e);
  process.exit(1);
}
