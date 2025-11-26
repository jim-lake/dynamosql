const { runTests } = require('../test_sql_helper');
const path = require('node:path');

describe('Expression', function () {
  runTests(
    'binary_expression.sql',
    path.join(__dirname, 'binary_expression.sql')
  );

  runTests(
    'unary_expression.sql',
    path.join(__dirname, 'unary_expression.sql')
  );

  runTests('date.sql', path.join(__dirname, 'date.sql'));
  runTests('interval.sql', path.join(__dirname, 'interval.sql'));
  runTests('string.sql', path.join(__dirname, 'string.sql'));
  runTests('precedence.sql', path.join(__dirname, 'precedence.sql'));
  runTests('functions.sql', path.join(__dirname, 'functions.sql'));
  runTests('cast.sql', path.join(__dirname, 'cast.sql'));
  runTests('cast_edge_cases.sql', path.join(__dirname, 'cast_edge_cases.sql'));
  runTests('datetime.sql', path.join(__dirname, 'datetime.sql'));
  runTests('variables.sql', path.join(__dirname, 'variables.sql'));
  runTests('operators.sql', path.join(__dirname, 'operators.sql'));
  runTests('null_handling.sql', path.join(__dirname, 'null_handling.sql'));
  runTests('timezone.sql', path.join(__dirname, 'timezone.sql'));
  runTests('new_functions.sql', path.join(__dirname, 'new_functions.sql'));
});
