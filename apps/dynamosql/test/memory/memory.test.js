const { runTests } = require('../test_sql_helper');
const path = require('node:path');

describe('Temp', function () {
  runTests('temp.sql', path.join(__dirname, 'temp.sql'), {
    checkChanged: true,
  });
  runTests('temp_error.sql', path.join(__dirname, 'temp_error.sql'), {
    allowedErrors: 'SAME_CODE',
    skipAffected: true,
    checkChanged: true,
  });
  runTests(
    'memory_edge_cases.sql',
    path.join(__dirname, 'memory_edge_cases.sql'),
    { checkChanged: true }
  );
  runTests('memory_json.sql', path.join(__dirname, 'memory_json.sql'), {
    checkChanged: true,
    verify_field_types: true,
  });
  runTests(
    'memory_json_error.sql',
    path.join(__dirname, 'memory_json_error.sql'),
    { allowedErrors: 'SAME_CODE', checkChanged: true, verify_field_types: true }
  );
  runTests(
    'memory_json_arrow.sql',
    path.join(__dirname, 'memory_json_arrow.sql'),
    { checkChanged: true, verify_field_types: true }
  );
  runTests(
    'memory_json_arrow_error.sql',
    path.join(__dirname, 'memory_json_arrow_error.sql'),
    {
      allowedErrors: 'SAME_CODE',
      skipAffected: true,
      checkChanged: true,
      verify_field_types: true,
    }
  );
  runTests('collation.sql', path.join(__dirname, 'collation.sql'), {
    checkChanged: true,
  });
});
