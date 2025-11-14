const { runTests } = require('../test_sql_helper');
const path = require('node:path');

describe('Update', function () {
  runTests('update.sql', path.join(__dirname, 'update.sql'));
  runTests('multi_table.sql', path.join(__dirname, 'multi_table.sql'));
  runTests('edge_cases.sql', path.join(__dirname, 'edge_cases.sql'));
});
