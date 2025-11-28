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
  runTests('variables.sql', path.join(__dirname, 'variables.sql'), {});
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
});
