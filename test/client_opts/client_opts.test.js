const { runTests } = require('../test_sql_helper');
const path = require('node:path');

describe('Client Opts', function () {
  runTests(
    'type_cast.sql',
    path.join(__dirname, 'type_cast.sql'),
    {
      mysql: {
        dateStrings: false,
      },
      session: {
        resultObjects: true,
        dateStrings: false,
      },
    }
  );

  runTests(
    'date_strings.sql',
    path.join(__dirname, 'date_strings.sql'),
    {
      mysql: {
        dateStrings: true,
      },
      session: {
        resultObjects: true,
        dateStrings: true,
      },
    }
  );
});
