const { runTests } = require('../test_sql_helper');
const path = require('node:path');

describe('information_schema', function () {
  runTests(
    'information_schema.sql',
    path.join(__dirname, 'information_schema.sql')
  );
});
