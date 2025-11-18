const { runTests } = require('../test_sql_helper');
const path = require('node:path');

describe('Delete', function () {
  runTests('delete.sql', path.join(__dirname, 'delete.sql'));
  runTests('multi_table.sql', path.join(__dirname, 'multi_table.sql'));
  runTests(
    'delete_edge_cases.sql',
    path.join(__dirname, 'delete_edge_cases.sql')
  );
});
