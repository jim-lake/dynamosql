const { runTests } = require('../test_sql_helper');
const path = require('node:path');

describe('Lock', function () {
  runTests('lock.sql', path.join(__dirname, 'lock.sql'));
  runTests('lock_column.sql', path.join(__dirname, 'lock_column.sql'));
  runTests('lock_error.sql', path.join(__dirname, 'lock_error.sql'), {
    allowedErrors: 'SAME_CODE',
    skipAffected: true,
  });
});
