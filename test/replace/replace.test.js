const { runTests } = require('../test_sql_helper');
const path = require('node:path');

describe('Replace', function () {
  runTests('replace.sql', path.join(__dirname, 'replace.sql'), {
    skipAffected: true,
  });
});
