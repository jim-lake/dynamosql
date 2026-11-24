const { runTests } = require('../test_sql_helper');
const path = require('node:path');

describe('Update', function () {
  runTests('update.sql', path.join(__dirname, 'update.sql'));
  runTests('multi_table.sql', path.join(__dirname, 'multi_table.sql'), {
    checkChanged: true,
  });
  runTests('edge_cases.sql', path.join(__dirname, 'edge_cases.sql'));
  runTests('update_ignore.sql', path.join(__dirname, 'update_ignore.sql'), {
    checkChanged: true,
  });
  runTests('order_limit.sql', path.join(__dirname, 'order_limit.sql'), {
    checkChanged: true,
  });
  runTests(
    'multi_table_comma.sql',
    path.join(__dirname, 'multi_table_comma.sql'),
    { checkChanged: true }
  );
  runTests(
    'division_by_zero_raw.sql',
    path.join(__dirname, 'division_by_zero_raw.sql'),
    { allowedErrors: 'SAME_CODE', skipAffected: true, checkChanged: true }
  );
  runTests(
    'division_by_zero_ignore.sql',
    path.join(__dirname, 'division_by_zero_ignore.sql'),
    { checkChanged: true }
  );
  runTests(
    'division_by_zero_error.sql',
    path.join(__dirname, 'division_by_zero_error.sql'),
    { allowedErrors: 'SAME_CODE', skipAffected: true, checkChanged: true }
  );
  runTests('pad_update_raw.sql', path.join(__dirname, 'pad_update_raw.sql'), {
    checkChanged: true,
  });
});
