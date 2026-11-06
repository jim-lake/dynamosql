const { runTests } = require('../test_sql_helper');
const path = require('node:path');

describe('Insert', function () {
  runTests('insert.sql', path.join(__dirname, 'insert.sql'));
  runTests('insert_select.sql', path.join(__dirname, 'insert_select.sql'));
  runTests('edge_cases.sql', path.join(__dirname, 'edge_cases.sql'));
  runTests(
    'on_duplicate_key.sql',
    path.join(__dirname, 'on_duplicate_key.sql'),
    { checkChanged: true }
  );
  runTests(
    'on_duplicate_key_raw.sql',
    path.join(__dirname, 'on_duplicate_key_raw.sql'),
    { checkChanged: true, skipAffected: true }
  );
});
