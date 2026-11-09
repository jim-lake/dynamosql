const { runTests } = require('../test_sql_helper');
const path = require('node:path');

describe('Select', function () {
  runTests('select.sql', path.join(__dirname, 'select.sql'));
  runTests('sort.sql', path.join(__dirname, 'sort.sql'));
  runTests('sort_error.sql', path.join(__dirname, 'sort_error.sql'), {
    allowedErrors: 'SAME_CODE',
  });
  runTests('group.sql', path.join(__dirname, 'group.sql'));
  runTests('limit.sql', path.join(__dirname, 'limit.sql'));
  runTests('where.sql', path.join(__dirname, 'where.sql'));
  runTests(
    'where_truthiness.sql',
    path.join(__dirname, 'where_truthiness.sql')
  );
  runTests('alias.sql', path.join(__dirname, 'alias.sql'));
  runTests(
    'group_edge_cases.sql',
    path.join(__dirname, 'group_edge_cases.sql')
  );
  runTests('having.sql', path.join(__dirname, 'having.sql'));
  runTests('having_error.sql', path.join(__dirname, 'having_error.sql'), {
    allowedErrors: 'SAME_CODE',
    skipAffected: true,
  });
  runTests('subquery.sql', path.join(__dirname, 'subquery.sql'));
  runTests('subquery_error.sql', path.join(__dirname, 'subquery_error.sql'), {
    allowedErrors: 'SAME_CODE',
    skipAffected: true,
  });
  runTests('derived_table.sql', path.join(__dirname, 'derived_table.sql'));
  runTests(
    'derived_table_error.sql',
    path.join(__dirname, 'derived_table_error.sql'),
    { allowedErrors: 'SAME_CODE', skipAffected: true },
    path.join(__dirname, 'advanced.sql')
  );
  runTests('advanced_error.sql', path.join(__dirname, 'advanced_error.sql'), {
    allowedErrors: 'SAME_CODE',
    skipAffected: true,
  });
  runTests('aggregate.sql', path.join(__dirname, 'aggregate.sql'));
  runTests('window.sql', path.join(__dirname, 'window.sql'));
  runTests('window_rank_lag.sql', path.join(__dirname, 'window_rank_lag.sql'));
  runTests('window_lead.sql', path.join(__dirname, 'window_lead.sql'));
  runTests('window_error.sql', path.join(__dirname, 'window_error.sql'), {
    allowedErrors: 'SAME_CODE',
    skipAffected: true,
  });
  runTests('cast.sql', path.join(__dirname, 'cast.sql'));
  runTests('functions.sql', path.join(__dirname, 'functions.sql'));
  runTests('null_handling.sql', path.join(__dirname, 'null_handling.sql'));
  runTests('operators.sql', path.join(__dirname, 'operators.sql'));
  runTests('string_funcs.sql', path.join(__dirname, 'string_funcs.sql'));
  runTests('collation_raw.sql', path.join(__dirname, 'collation_raw.sql'));
  runTests('syntax.sql', path.join(__dirname, 'syntax.sql'));
});
