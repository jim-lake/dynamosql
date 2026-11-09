const { runTests } = require('../test_sql_helper');
const path = require('node:path');

describe('Insert', function () {
  runTests('insert.sql', path.join(__dirname, 'insert.sql'));
  runTests('insert_error.sql', path.join(__dirname, 'insert_error.sql'), {
    allowedErrors: 'SAME_CODE',
  });
  runTests('insert_select.sql', path.join(__dirname, 'insert_select.sql'));
  runTests(
    'insert_select_error.sql',
    path.join(__dirname, 'insert_select_error.sql'),
    { allowedErrors: 'SAME_CODE' }
  );
  runTests('edge_cases.sql', path.join(__dirname, 'edge_cases.sql'));
  runTests(
    'edge_cases_error.sql',
    path.join(__dirname, 'edge_cases_error.sql'),
    { allowedErrors: 'SAME_CODE' }
  );
  runTests(
    'on_duplicate_key.sql',
    path.join(__dirname, 'on_duplicate_key.sql'),
    { checkChanged: true }
  );
  runTests(
    'on_duplicate_key_error.sql',
    path.join(__dirname, 'on_duplicate_key_error.sql'),
    { allowedErrors: 'SAME_CODE', skipAffected: true, checkChanged: true }
  );
  runTests(
    'on_duplicate_key_raw.sql',
    path.join(__dirname, 'on_duplicate_key_raw.sql'),
    { checkChanged: true, skipAffected: true }
  );
  runTests('no_column_list.sql', path.join(__dirname, 'no_column_list.sql'));
  runTests(
    'no_column_list_error.sql',
    path.join(__dirname, 'no_column_list_error.sql'),
    { allowedErrors: 'SAME_CODE' }
  );
  runTests(
    'division_by_zero_error.sql',
    path.join(__dirname, 'division_by_zero_error.sql'),
    { allowedErrors: 'SAME_CODE', skipAffected: true, checkChanged: true }
  );
  runTests(
    'division_by_zero_ignore.sql',
    path.join(__dirname, 'division_by_zero_ignore.sql')
  );
  runTests(
    'division_by_zero_raw.sql',
    path.join(__dirname, 'division_by_zero_raw.sql'),
    { allowedErrors: 'SAME_CODE', skipAffected: true, checkChanged: true }
  );
  runTests('syntax.sql', path.join(__dirname, 'syntax.sql'));
});
