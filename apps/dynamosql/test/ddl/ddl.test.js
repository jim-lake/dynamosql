const { runTests } = require('../test_sql_helper');
const path = require('node:path');

describe('DDL', function () {
  runTests('create.sql', path.join(__dirname, 'create.sql'), {
    skipAffected: true,
    timeout: 15000,
  });
  runTests('ctas.sql', path.join(__dirname, 'ctas.sql'), {
    skipAffected: true,
    timeout: 15000,
  });
  runTests('alter.sql', path.join(__dirname, 'alter.sql'), {
    skipAffected: true,
    timeout: 15000,
  });
  runTests('show.sql', path.join(__dirname, 'show.sql'), {
    skipAffected: true,
    timeout: 15000,
  });
  runTests('transactions.sql', path.join(__dirname, 'transactions.sql'), {
    skipAffected: true,
    timeout: 15000,
  });
  runTests(
    'create_variations.sql',
    path.join(__dirname, 'create_variations.sql'),
    { skipAffected: true, timeout: 15000 }
  );
});
