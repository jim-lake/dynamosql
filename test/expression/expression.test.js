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
});
