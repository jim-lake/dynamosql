const { runTests } = require('../test_sql_helper');
const path = require('node:path');

describe('Update', function () {
  runTests('update.sql', path.join(__dirname, 'update.sql'));
  runTests('multi_table.sql', path.join(__dirname, 'multi_table.sql'));
  runTests('edge_cases.sql', path.join(__dirname, 'edge_cases.sql'));
  runTests('update_ignore.sql', path.join(__dirname, 'update_ignore.sql'));
  runTests('order_limit.sql', path.join(__dirname, 'order_limit.sql'));
  runTests(
    'multi_table_comma.sql',
    path.join(__dirname, 'multi_table_comma.sql')
  );
});
