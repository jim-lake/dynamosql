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
  runTests(
    'memory_key_normalize.sql',
    path.join(__dirname, 'memory_key_normalize.sql'),
    { checkChanged: true }
  );
  runTests(
    'memory_key_normalize_error.sql',
    path.join(__dirname, 'memory_key_normalize_error.sql'),
    { allowedErrors: 'SAME_CODE', skipAffected: true, checkChanged: true }
  );
  runTests('memory_unique.sql', path.join(__dirname, 'memory_unique.sql'), {
    checkChanged: true,
  });
  runTests(
    'memory_unique_error.sql',
    path.join(__dirname, 'memory_unique_error.sql'),
    { allowedErrors: 'SAME_CODE', skipAffected: true, checkChanged: true }
  );
  runTests('memory_strict.sql', path.join(__dirname, 'memory_strict.sql'), {
    checkChanged: true,
  });
  runTests(
    'memory_strict_error.sql',
    path.join(__dirname, 'memory_strict_error.sql'),
    { allowedErrors: 'SAME_CODE', skipAffected: true, checkChanged: true }
  );
  runTests(
    'memory_null_matrix_error.sql',
    path.join(__dirname, 'memory_null_matrix_error.sql'),
    { allowedErrors: 'SAME_CODE', skipAffected: true, checkChanged: true }
  );
  runTests(
    'memory_misuse_error.sql',
    path.join(__dirname, 'memory_misuse_error.sql'),
    { allowedErrors: 'SAME_CODE', skipAffected: true, checkChanged: true }
  );
  for (const name of [
    'memory_convert_int.sql',
    'memory_convert_int_nonstrict.sql',
    'memory_convert_decimal.sql',
    'memory_convert_double.sql',
    'memory_convert_string.sql',
    'memory_convert_update.sql',
    'memory_convert_dup.sql',
    'memory_convert_string_nonstrict.sql',
    'memory_convert_ignore.sql',
    'memory_convert_nonstrict_range.sql',
    'memory_convert_precision.sql',
    'memory_convert_trim.sql',
    'memory_convert_numeric_literal.sql',
  ]) {
    runTests(name, path.join(__dirname, name), { checkChanged: true });
  }
  for (const name of [
    'memory_convert_int_error.sql',
    'memory_convert_int_nonstrict_error.sql',
    'memory_convert_decimal_error.sql',
    'memory_convert_double_error.sql',
    'memory_convert_string_error.sql',
    'memory_convert_string_nonstrict_error.sql',
    'memory_convert_ignore_error.sql',
    'memory_convert_precision_error.sql',
    'memory_convert_empty_error.sql',
    'memory_convert_char_error.sql',
  ]) {
    runTests(name, path.join(__dirname, name), {
      allowedErrors: 'SAME_CODE',
      skipAffected: true,
      checkChanged: true,
    });
  }
});
