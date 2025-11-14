const { runTests } = require('../test_sql_helper');
const path = require('node:path');

describe('Select', function () {
  runTests('select.sql', path.join(__dirname, 'select.sql'));
  runTests('sort.sql', path.join(__dirname, 'sort.sql'));
  runTests('group.sql', path.join(__dirname, 'group.sql'));
  runTests('limit.sql', path.join(__dirname, 'limit.sql'));
  runTests('where.sql', path.join(__dirname, 'where.sql'));
  runTests('alias.sql', path.join(__dirname, 'alias.sql'));
  runTests(
    'group_edge_cases.sql',
    path.join(__dirname, 'group_edge_cases.sql')
  );
  runTests('subquery.sql', path.join(__dirname, 'subquery.sql'));
});
