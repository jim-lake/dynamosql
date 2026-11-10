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
  runTests(
    'memory_truthiness.sql',
    path.join(__dirname, 'memory_truthiness.sql'),
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
  runTests('temp_keyless.sql', path.join(__dirname, 'temp_keyless.sql'), {
    checkChanged: true,
  });
  runTests(
    'temp_keyless_error.sql',
    path.join(__dirname, 'temp_keyless_error.sql'),
    { allowedErrors: 'SAME_CODE', skipAffected: true, checkChanged: true }
  );
  runTests('memory_intstr.sql', path.join(__dirname, 'memory_intstr.sql'), {
    checkChanged: true,
  });
  runTests('memory_unique.sql', path.join(__dirname, 'memory_unique.sql'), {
    checkChanged: true,
  });
  runTests(
    'memory_unique_error.sql',
    path.join(__dirname, 'memory_unique_error.sql'),
    { allowedErrors: 'SAME_CODE', skipAffected: true, checkChanged: true }
  );
  runTests(
    'memory_misuse_error.sql',
    path.join(__dirname, 'memory_misuse_error.sql'),
    { allowedErrors: 'SAME_CODE', skipAffected: true, checkChanged: true }
  );
});
