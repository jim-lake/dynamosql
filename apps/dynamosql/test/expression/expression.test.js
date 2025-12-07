const { runTests } = require('../test_sql_helper');
const path = require('node:path');

describe('Expression', function () {
  runTests(
    'binary_expression.sql',
    path.join(__dirname, 'binary_expression.sql'),
    { verify_field_types: true }
  );
  runTests(
    'unary_expression.sql',
    path.join(__dirname, 'unary_expression.sql'),
    { verify_field_types: true }
  );
  runTests('date.sql', path.join(__dirname, 'date.sql'), {
    verify_field_types: true,
  });
  runTests('interval.sql', path.join(__dirname, 'interval.sql'), {
    verify_field_types: true,
  });
  runTests('string.sql', path.join(__dirname, 'string.sql'), {
    verify_field_types: true,
  });
  runTests('precedence.sql', path.join(__dirname, 'precedence.sql'), {
    verify_field_types: true,
  });
  runTests('functions.sql', path.join(__dirname, 'functions.sql'), {
    verify_field_types: true,
  });
  runTests('cast.sql', path.join(__dirname, 'cast.sql'), {
    verify_field_types: true,
  });
  runTests('cast_edge_cases.sql', path.join(__dirname, 'cast_edge_cases.sql'), {
    verify_field_types: true,
  });
  runTests('datetime.sql', path.join(__dirname, 'datetime.sql'), {
    verify_field_types: true,
  });
  runTests('variables.sql', path.join(__dirname, 'variables.sql'), {
    verify_field_types: true,
  });
  runTests('operators.sql', path.join(__dirname, 'operators.sql'), {
    verify_field_types: true,
  });
  runTests('null_handling.sql', path.join(__dirname, 'null_handling.sql'), {
    verify_field_types: true,
  });
  runTests('timezone.sql', path.join(__dirname, 'timezone.sql'), {
    verify_field_types: true,
  });
  runTests('new_functions.sql', path.join(__dirname, 'new_functions.sql'), {
    verify_field_types: true,
  });
  runTests('aggregate_funcs.sql', path.join(__dirname, 'aggregate_funcs.sql'), {
    verify_field_types: true,
  });
  runTests('string_funcs.sql', path.join(__dirname, 'string_funcs.sql'), {
    verify_field_types: true,
  });
  runTests(
    'function_greatest.sql',
    path.join(__dirname, 'function_greatest.sql'),
    { verify_field_types: true }
  );
  runTests('function_least.sql', path.join(__dirname, 'function_least.sql'), {
    verify_field_types: true,
  });
  runTests(
    'function_success_cases.sql',
    path.join(__dirname, 'function_success_cases.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_datetime_types.sql',
    path.join(__dirname, 'function_datetime_types.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_type_combinations.sql',
    path.join(__dirname, 'function_type_combinations.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_edge_cases.sql',
    path.join(__dirname, 'function_edge_cases.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_arithmetic_types.sql',
    path.join(__dirname, 'function_arithmetic_types.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_comparison_types.sql',
    path.join(__dirname, 'function_comparison_types.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_string_types.sql',
    path.join(__dirname, 'function_string_types.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_logical_types.sql',
    path.join(__dirname, 'function_logical_types.sql'),
    { verify_field_types: true }
  );
  runTests('function_user.sql', path.join(__dirname, 'function_user.sql'), {
    verify_field_types: true,
  });
  runTests(
    'function_charset.sql',
    path.join(__dirname, 'function_charset.sql'),
    { verify_field_types: true }
  );
  runTests('function_tier3.sql', path.join(__dirname, 'function_tier3.sql'), {
    verify_field_types: true,
  });
  runTests('function_utc.sql', path.join(__dirname, 'function_utc.sql'), {
    verify_field_types: true,
  });
  runTests(
    'function_days_seconds.sql',
    path.join(__dirname, 'function_days_seconds.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_time_sec.sql',
    path.join(__dirname, 'function_time_sec.sql'),
    { verify_field_types: true }
  );
  runTests('function_make.sql', path.join(__dirname, 'function_make.sql'), {
    verify_field_types: true,
  });
  runTests(
    'function_bit_count.sql',
    path.join(__dirname, 'function_bit_count.sql'),
    { verify_field_types: true }
  );
  runTests('function_hash.sql', path.join(__dirname, 'function_hash.sql'), {
    verify_field_types: true,
  });
  runTests(
    'function_crc_conv.sql',
    path.join(__dirname, 'function_crc_conv.sql'),
    { verify_field_types: true }
  );
  runTests('function_uuid.sql', path.join(__dirname, 'function_uuid.sql'), {
    verify_field_types: true,
  });
  runTests('function_inet.sql', path.join(__dirname, 'function_inet.sql'), {
    verify_field_types: true,
  });
  runTests(
    'function_truncate_rand.sql',
    path.join(__dirname, 'function_truncate_rand.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_aggregate_stats.sql',
    path.join(__dirname, 'function_aggregate_stats.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_aggregate_bitwise.sql',
    path.join(__dirname, 'function_aggregate_bitwise.sql'),
    { verify_field_types: true }
  );
});
