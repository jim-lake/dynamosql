const { runTests } = require('../test_sql_helper');
const path = require('node:path');

describe('Insert', function () {
  runTests('insert.sql', path.join(__dirname, 'insert.sql'));
});
describe('Insert', function () {
  runTests('insert_select.sql', path.join(__dirname, 'insert_select.sql'));
});
