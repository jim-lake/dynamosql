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
});
