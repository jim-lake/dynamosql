const { runDynamoTests } = require('../test_dynamo_sql_helper');
const path = require('node:path');

describe('Raw only', function () {
  runDynamoTests(
    'json_update_raw_only.sql',
    path.join(__dirname, 'json_update_raw_only.sql'),
    { timeout: 15000 }
  );
  runDynamoTests(
    'json_types_raw_only.sql',
    path.join(__dirname, 'json_types_raw_only.sql'),
    { timeout: 15000 }
  );
  runDynamoTests(
    'insert_select_raw_only.sql',
    path.join(__dirname, 'insert_select_raw_only.sql'),
    { timeout: 15000 }
  );
  runDynamoTests(
    'insert_edge_cases_raw_only.sql',
    path.join(__dirname, 'insert_edge_cases_raw_only.sql'),
    { timeout: 15000 }
  );
  runDynamoTests(
    'on_duplicate_key_raw_raw_only.sql',
    path.join(__dirname, 'on_duplicate_key_raw_raw_only.sql'),
    { timeout: 15000 }
  );
  runDynamoTests(
    'pad_insert_raw_only.sql',
    path.join(__dirname, 'pad_insert_raw_only.sql'),
    { timeout: 15000 }
  );
  runDynamoTests(
    'pad_update_raw_only.sql',
    path.join(__dirname, 'pad_update_raw_only.sql'),
    { timeout: 15000 }
  );
  runDynamoTests(
    'update_ignore_raw_only.sql',
    path.join(__dirname, 'update_ignore_raw_only.sql'),
    { timeout: 15000 }
  );
  runDynamoTests(
    'update_edge_cases_raw_only.sql',
    path.join(__dirname, 'update_edge_cases_raw_only.sql'),
    { timeout: 15000 }
  );
  runDynamoTests(
    'replace_edge_cases_raw_only.sql',
    path.join(__dirname, 'replace_edge_cases_raw_only.sql'),
    { timeout: 15000 }
  );
  runDynamoTests(
    'join_using_raw_only.sql',
    path.join(__dirname, 'join_using_raw_only.sql'),
    { timeout: 15000 }
  );
  runDynamoTests(
    'json_number_write_raw_only.sql',
    path.join(__dirname, 'json_number_write_raw_only.sql'),
    { timeout: 15000 }
  );
});
