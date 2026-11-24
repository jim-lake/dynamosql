const { runTests } = require('../test_sql_helper');
const path = require('node:path');

describe('DDL', function () {
  runTests('transactions.sql', path.join(__dirname, 'transactions.sql'), {
    timeout: 30000,
  });

  runTests(
    'create.sql',
    path.join(__dirname, 'create.sql'),
    { timeout: 30000 },
    true
  );

  runTests(
    'ctas.sql',
    path.join(__dirname, 'ctas.sql'),
    { timeout: 30000 },
    true
  );
  runTests(
    'ctas_select.sql',
    path.join(__dirname, 'ctas_select.sql'),
    { timeout: 30000 },
    true
  );
  runTests('ctas_error.sql', path.join(__dirname, 'ctas_error.sql'), {
    allowedErrors: 'SAME_CODE',
    timeout: 30000,
  });
  runTests(
    'alter.sql',
    path.join(__dirname, 'alter.sql'),
    { timeout: 30000 },
    true
  );
  runTests(
    'create_variations.sql',
    path.join(__dirname, 'create_variations.sql'),
    { timeout: 30000 },
    true
  );
  runTests(
    'create_variations_error.sql',
    path.join(__dirname, 'create_variations_error.sql'),
    { allowedErrors: 'SAME_CODE', timeout: 30000 },
    true
  );
  runTests(
    'drop.sql',
    path.join(__dirname, 'drop.sql'),
    { timeout: 30000 },
    true
  );
  runTests('show.sql', path.join(__dirname, 'show.sql'), { timeout: 30000 });
  runTests('show_columns.sql', path.join(__dirname, 'show_columns.sql'), {
    timeout: 30000,
    verify_field_types: true,
  });
  runTests('show_index.sql', path.join(__dirname, 'show_index.sql'), {
    timeout: 30000,
  });
  runTests('show_create.sql', path.join(__dirname, 'show_create.sql'), {
    timeout: 30000,
  });
  runTests('show_warnings.sql', path.join(__dirname, 'show_warnings.sql'), {
    timeout: 30000,
  });
  runTests('show_error.sql', path.join(__dirname, 'show_error.sql'), {
    allowedErrors: 'SAME_CODE',
    timeout: 30000,
  });
  runTests(
    'error_cases.sql',
    path.join(__dirname, 'error_cases.sql'),
    { timeout: 30000 },
    true
  );
  runTests(
    'error_cases_error.sql',
    path.join(__dirname, 'error_cases_error.sql'),
    { allowedErrors: 'SAME_CODE', timeout: 30000 },
    true
  );
  runTests(
    'create_temporary.sql',
    path.join(__dirname, 'create_temporary.sql')
  );
  runTests('create_types.sql', path.join(__dirname, 'create_types.sql'), {
    verify_field_types: true,
  });
  runTests('drop_multi.sql', path.join(__dirname, 'drop_multi.sql'));
  runTests(
    'transaction_modes.sql',
    path.join(__dirname, 'transaction_modes.sql')
  );
});
