const { runTests } = require('../test_sql_helper');
const path = require('node:path');

describe('DDL', function () {
  runTests('create.sql', path.join(__dirname, 'create.sql'), {
    skipAffected: true,
    timeout: 15000,
  });
});

describe('DDL', function () {
  runTests('ctas.sql', path.join(__dirname, 'ctas.sql'), {
    skipAffected: true,
    timeout: 15000,
  });
});
