const { runTests } = require('../test_sql_helper');
const path = require('node:path');

function uppercaseStrings(field, next) {
  return field.type === 'VAR_STRING' ? field.string()?.toUpperCase() : next();
}

describe('Client Opts', function () {
  runTests('type_cast.sql', path.join(__dirname, 'type_cast.sql'), {
    mysql: { dateStrings: false },
    session: { resultObjects: true, dateStrings: false },
  });

  runTests('date_strings.sql', path.join(__dirname, 'date_strings.sql'), {
    mysql: { dateStrings: true },
    session: { resultObjects: true, dateStrings: true },
  });

  runTests('nest_tables.sql', path.join(__dirname, 'nest_tables.sql'), {
    mysql: { dateStrings: true },
    session: { resultObjects: true, dateStrings: true },
    nestTables: true,
  });

  runTests(
    'multiple_statements.sql',
    path.join(__dirname, 'multiple_statements.sql'),
    {
      mysql: { multipleStatements: true },
      session: { multipleStatements: true },
    }
  );

  runTests('result_objects.sql', path.join(__dirname, 'result_objects.sql'), {
    mysql: { dateStrings: false },
    session: { resultObjects: false, dateStrings: false },
  });

  runTests(
    'decimal_numbers.sql (strings)',
    path.join(__dirname, 'decimal_numbers.sql'),
    {
      mysql: { decimalNumbers: false },
      session: { resultObjects: true, decimalNumbers: false },
    }
  );

  runTests(
    'decimal_numbers.sql (numbers)',
    path.join(__dirname, 'decimal_numbers.sql'),
    {
      mysql: { decimalNumbers: true },
      session: { resultObjects: true, decimalNumbers: true },
    }
  );

  runTests(
    'big_numbers.sql (supportBigNumbers)',
    path.join(__dirname, 'big_numbers.sql'),
    {
      mysql: { supportBigNumbers: true },
      session: { resultObjects: true, supportBigNumbers: true },
    }
  );

  runTests(
    'big_numbers.sql (bigNumberStrings)',
    path.join(__dirname, 'big_numbers.sql'),
    {
      mysql: { supportBigNumbers: true, bigNumberStrings: true },
      session: {
        resultObjects: true,
        supportBigNumbers: true,
        bigNumberStrings: true,
      },
    }
  );

  runTests(
    'date_strings_false.sql',
    path.join(__dirname, 'date_strings_false.sql'),
    {
      mysql: { dateStrings: false },
      session: { resultObjects: true, dateStrings: false },
    }
  );

  runTests(
    'nest_tables.sql (separator)',
    path.join(__dirname, 'nest_tables_separator.sql'),
    {
      mysql: { dateStrings: true },
      session: { resultObjects: true, dateStrings: true },
      nestTables: '_',
    }
  );

  runTests(
    'type_cast.sql (typeCast false)',
    path.join(__dirname, 'type_cast.sql'),
    {
      mysql: { typeCast: false },
      session: { resultObjects: true, typeCast: false },
    }
  );

  runTests(
    'type_cast_function.sql (typeCast function)',
    path.join(__dirname, 'type_cast_function.sql'),
    {
      mysql: { typeCast: uppercaseStrings },
      session: { resultObjects: true, typeCast: uppercaseStrings },
    }
  );
});
