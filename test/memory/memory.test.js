const { runTests } = require('../test_sql_helper');
const path = require('node:path');

describe('Temp', function () {
  runTests('temp.sql', path.join(__dirname, 'temp.sql'), {
    checkChanged: true,
  });
});
