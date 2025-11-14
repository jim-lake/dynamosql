const { runTests } = require('../test_sql_helper');
const path = require('node:path');

describe('Join', function () {
  runTests('join.sql', path.join(__dirname, 'join.sql'), {
    session: { resultObjects: true },
    nestTables: true,
  });
  runTests('edge_cases.sql', path.join(__dirname, 'edge_cases.sql'), {
    session: { resultObjects: true },
    nestTables: true,
  });
});
