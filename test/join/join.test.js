const { runTests } = require('../test_sql_helper');
const path = require('node:path');

describe('Join', function () {
  runTests('join.sql', path.join(__dirname, 'join.sql'), {
    session: {
      resultObjects: true,
    },
    nestTables: true,
  });
});
