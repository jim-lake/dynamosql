const { runTests } = require('../test_sql_helper');
const path = require('node:path');

describe('Select', function () {
  runTests('select.sql', path.join(__dirname, 'select.sql'));
  runTests('sort.sql', path.join(__dirname, 'sort.sql'));
  runTests('group.sql', path.join(__dirname, 'group.sql'));
});
