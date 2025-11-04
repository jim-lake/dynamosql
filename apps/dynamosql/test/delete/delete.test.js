const { runTests } = require('../test_sql_helper');
const path = require('node:path');

describe('Delete', function () {
  runTests('delete.sql', path.join(__dirname, 'delete.sql'));
});
