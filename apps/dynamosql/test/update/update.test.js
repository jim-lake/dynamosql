const { runTests } = require('../test_sql_helper');
const path = require('node:path');

describe('Update', function () {
  runTests('update.sql', path.join(__dirname, 'update.sql'));
});
