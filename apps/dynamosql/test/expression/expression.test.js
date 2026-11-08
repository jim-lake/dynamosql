const { runTests } = require('../test_sql_helper');
const path = require('node:path');

describe('Expression', function () {
  runTests(
    'binary_expression.sql',
    path.join(__dirname, 'binary_expression.sql'),
    { verify_field_types: true }
  );
  runTests(
    'unary_expression.sql',
    path.join(__dirname, 'unary_expression.sql'),
    { verify_field_types: true }
  );
  runTests('date.sql', path.join(__dirname, 'date.sql'), {
    verify_field_types: true,
  });
  runTests('date_error.sql', path.join(__dirname, 'date_error.sql'), {
    allowedErrors: 'SAME_CODE',
    verify_field_types: true,
  });
  runTests('interval.sql', path.join(__dirname, 'interval.sql'), {
    verify_field_types: true,
  });
  runTests('string.sql', path.join(__dirname, 'string.sql'), {
    verify_field_types: true,
  });
  runTests('precedence.sql', path.join(__dirname, 'precedence.sql'), {
    verify_field_types: true,
  });
  runTests('functions.sql', path.join(__dirname, 'functions.sql'), {
    verify_field_types: true,
  });
  runTests('functions_error.sql', path.join(__dirname, 'functions_error.sql'), {
    allowedErrors: 'SAME_CODE',
    verify_field_types: true,
  });
  runTests('cast.sql', path.join(__dirname, 'cast.sql'), {
    verify_field_types: true,
  });
  runTests('cast_error.sql', path.join(__dirname, 'cast_error.sql'), {
    allowedErrors: 'SAME_CODE',
    verify_field_types: true,
  });
  runTests('cast_edge_cases.sql', path.join(__dirname, 'cast_edge_cases.sql'), {
    verify_field_types: true,
  });
  runTests('datetime.sql', path.join(__dirname, 'datetime.sql'), {
    verify_field_types: true,
  });
  runTests('datetime_error.sql', path.join(__dirname, 'datetime_error.sql'), {
    allowedErrors: 'SAME_CODE',
    verify_field_types: true,
  });
  runTests('variables.sql', path.join(__dirname, 'variables.sql'), {
    verify_field_types: true,
  });
  runTests('variables_error.sql', path.join(__dirname, 'variables_error.sql'), {
    allowedErrors: 'SAME_CODE',
    verify_field_types: true,
  });
  runTests('set_statements.sql', path.join(__dirname, 'set_statements.sql'), {
    verify_field_types: true,
  });
  runTests('operators.sql', path.join(__dirname, 'operators.sql'), {
    verify_field_types: true,
  });
  runTests('null_handling.sql', path.join(__dirname, 'null_handling.sql'), {
    verify_field_types: true,
  });
  runTests('timezone.sql', path.join(__dirname, 'timezone.sql'), {
    verify_field_types: true,
  });
  runTests('new_functions.sql', path.join(__dirname, 'new_functions.sql'), {
    verify_field_types: true,
  });
  runTests('aggregate_funcs.sql', path.join(__dirname, 'aggregate_funcs.sql'), {
    verify_field_types: true,
  });
  runTests('string_funcs.sql', path.join(__dirname, 'string_funcs.sql'), {
    verify_field_types: true,
  });
  runTests(
    'function_greatest.sql',
    path.join(__dirname, 'function_greatest.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_greatest_error.sql',
    path.join(__dirname, 'function_greatest_error.sql'),
    { allowedErrors: 'SAME_CODE', verify_field_types: true }
  );
  runTests('function_least.sql', path.join(__dirname, 'function_least.sql'), {
    verify_field_types: true,
  });
  runTests(
    'function_success_cases.sql',
    path.join(__dirname, 'function_success_cases.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_datetime_types.sql',
    path.join(__dirname, 'function_datetime_types.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_type_combinations.sql',
    path.join(__dirname, 'function_type_combinations.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_edge_cases.sql',
    path.join(__dirname, 'function_edge_cases.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_edge_cases_error.sql',
    path.join(__dirname, 'function_edge_cases_error.sql'),
    { allowedErrors: 'SAME_CODE', verify_field_types: true }
  );
  runTests(
    'function_arithmetic_types.sql',
    path.join(__dirname, 'function_arithmetic_types.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_comparison_types.sql',
    path.join(__dirname, 'function_comparison_types.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_string_types.sql',
    path.join(__dirname, 'function_string_types.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_string_types_error.sql',
    path.join(__dirname, 'function_string_types_error.sql'),
    { allowedErrors: 'SAME_CODE', verify_field_types: true }
  );
  runTests(
    'function_logical_types.sql',
    path.join(__dirname, 'function_logical_types.sql'),
    { verify_field_types: true }
  );
  runTests('function_user.sql', path.join(__dirname, 'function_user.sql'), {
    verify_field_types: true,
  });
  runTests(
    'function_charset.sql',
    path.join(__dirname, 'function_charset.sql'),
    { verify_field_types: true }
  );
  runTests('function_tier3.sql', path.join(__dirname, 'function_tier3.sql'), {
    verify_field_types: true,
  });
  runTests('function_utc.sql', path.join(__dirname, 'function_utc.sql'), {
    verify_field_types: true,
  });
  runTests(
    'function_days_seconds.sql',
    path.join(__dirname, 'function_days_seconds.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_time_sec.sql',
    path.join(__dirname, 'function_time_sec.sql'),
    { verify_field_types: true }
  );
  runTests('function_make.sql', path.join(__dirname, 'function_make.sql'), {
    verify_field_types: true,
  });
  runTests(
    'function_bit_count.sql',
    path.join(__dirname, 'function_bit_count.sql'),
    { verify_field_types: true }
  );
  runTests('function_hash.sql', path.join(__dirname, 'function_hash.sql'), {
    verify_field_types: true,
  });
  runTests(
    'function_crc_conv.sql',
    path.join(__dirname, 'function_crc_conv.sql'),
    { verify_field_types: true }
  );
  runTests('function_uuid.sql', path.join(__dirname, 'function_uuid.sql'), {
    verify_field_types: true,
  });
  runTests(
    'function_json_array.sql',
    path.join(__dirname, 'function_json_array.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_json_array_error.sql',
    path.join(__dirname, 'function_json_array_error.sql'),
    { allowedErrors: 'SAME_CODE', verify_field_types: true }
  );
  runTests(
    'function_json_extract.sql',
    path.join(__dirname, 'function_json_extract.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_json_extract_error.sql',
    path.join(__dirname, 'function_json_extract_error.sql'),
    { allowedErrors: 'SAME_CODE', verify_field_types: true }
  );
  runTests(
    'function_json_length.sql',
    path.join(__dirname, 'function_json_length.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_json_length_error.sql',
    path.join(__dirname, 'function_json_length_error.sql'),
    { allowedErrors: 'SAME_CODE', verify_field_types: true }
  );
  runTests(
    'function_json_valid.sql',
    path.join(__dirname, 'function_json_valid.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_json_valid_error.sql',
    path.join(__dirname, 'function_json_valid_error.sql'),
    { allowedErrors: 'SAME_CODE', verify_field_types: true }
  );
  runTests(
    'function_json_schema_valid.sql',
    path.join(__dirname, 'function_json_schema_valid.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_json_schema_valid_error.sql',
    path.join(__dirname, 'function_json_schema_valid_error.sql'),
    { allowedErrors: 'SAME_CODE', verify_field_types: true }
  );
  runTests(
    'function_json_schema_validation_report.sql',
    path.join(__dirname, 'function_json_schema_validation_report.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_json_schema_validation_report_error.sql',
    path.join(__dirname, 'function_json_schema_validation_report_error.sql'),
    { allowedErrors: 'SAME_CODE', verify_field_types: true }
  );
  runTests(
    'function_json_depth.sql',
    path.join(__dirname, 'function_json_depth.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_json_depth_error.sql',
    path.join(__dirname, 'function_json_depth_error.sql'),
    { allowedErrors: 'SAME_CODE', verify_field_types: true }
  );
  runTests(
    'function_json_keys.sql',
    path.join(__dirname, 'function_json_keys.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_json_keys_error.sql',
    path.join(__dirname, 'function_json_keys_error.sql'),
    { allowedErrors: 'SAME_CODE', verify_field_types: true }
  );
  runTests(
    'function_json_quote.sql',
    path.join(__dirname, 'function_json_quote.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_json_quote_error.sql',
    path.join(__dirname, 'function_json_quote_error.sql'),
    { allowedErrors: 'SAME_CODE', verify_field_types: true }
  );
  runTests(
    'function_json_type.sql',
    path.join(__dirname, 'function_json_type.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_json_type_error.sql',
    path.join(__dirname, 'function_json_type_error.sql'),
    { allowedErrors: 'SAME_CODE', verify_field_types: true }
  );
  runTests(
    'function_json_unquote.sql',
    path.join(__dirname, 'function_json_unquote.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_json_unquote_error.sql',
    path.join(__dirname, 'function_json_unquote_error.sql'),
    { allowedErrors: 'SAME_CODE', verify_field_types: true }
  );
  runTests(
    'function_json_object.sql',
    path.join(__dirname, 'function_json_object.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_json_object_error.sql',
    path.join(__dirname, 'function_json_object_error.sql'),
    { allowedErrors: 'SAME_CODE', verify_field_types: true }
  );
  runTests(
    'function_json_contains_path.sql',
    path.join(__dirname, 'function_json_contains_path.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_json_contains_path_error.sql',
    path.join(__dirname, 'function_json_contains_path_error.sql'),
    { allowedErrors: 'SAME_CODE', verify_field_types: true }
  );
  runTests(
    'function_json_remove.sql',
    path.join(__dirname, 'function_json_remove.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_json_remove_error.sql',
    path.join(__dirname, 'function_json_remove_error.sql'),
    { allowedErrors: 'SAME_CODE', verify_field_types: true }
  );
  runTests(
    'function_json_array_insert.sql',
    path.join(__dirname, 'function_json_array_insert.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_json_array_insert_error.sql',
    path.join(__dirname, 'function_json_array_insert_error.sql'),
    { allowedErrors: 'SAME_CODE', verify_field_types: true }
  );
  runTests(
    'function_json_set.sql',
    path.join(__dirname, 'function_json_set.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_json_set_error.sql',
    path.join(__dirname, 'function_json_set_error.sql'),
    { allowedErrors: 'SAME_CODE', verify_field_types: true }
  );
  runTests(
    'function_json_insert.sql',
    path.join(__dirname, 'function_json_insert.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_json_insert_error.sql',
    path.join(__dirname, 'function_json_insert_error.sql'),
    { allowedErrors: 'SAME_CODE', verify_field_types: true }
  );
  runTests(
    'function_json_replace.sql',
    path.join(__dirname, 'function_json_replace.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_json_replace_error.sql',
    path.join(__dirname, 'function_json_replace_error.sql'),
    { allowedErrors: 'SAME_CODE', verify_field_types: true }
  );
  runTests(
    'function_json_merge_preserve.sql',
    path.join(__dirname, 'function_json_merge_preserve.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_json_merge_preserve_error.sql',
    path.join(__dirname, 'function_json_merge_preserve_error.sql'),
    { allowedErrors: 'SAME_CODE', verify_field_types: true }
  );
  runTests(
    'function_json_merge.sql',
    path.join(__dirname, 'function_json_merge.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_json_merge_error.sql',
    path.join(__dirname, 'function_json_merge_error.sql'),
    { allowedErrors: 'SAME_CODE', verify_field_types: true }
  );
  runTests(
    'function_json_merge_patch.sql',
    path.join(__dirname, 'function_json_merge_patch.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_json_merge_patch_error.sql',
    path.join(__dirname, 'function_json_merge_patch_error.sql'),
    { allowedErrors: 'SAME_CODE', verify_field_types: true }
  );
  runTests(
    'function_json_contains.sql',
    path.join(__dirname, 'function_json_contains.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_json_contains_error.sql',
    path.join(__dirname, 'function_json_contains_error.sql'),
    { allowedErrors: 'SAME_CODE', verify_field_types: true }
  );
  runTests(
    'function_json_member_of.sql',
    path.join(__dirname, 'function_json_member_of.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_json_member_of_error.sql',
    path.join(__dirname, 'function_json_member_of_error.sql'),
    { allowedErrors: 'SAME_CODE', verify_field_types: true }
  );
  runTests(
    'function_json_overlaps.sql',
    path.join(__dirname, 'function_json_overlaps.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_json_overlaps_error.sql',
    path.join(__dirname, 'function_json_overlaps_error.sql'),
    { allowedErrors: 'SAME_CODE', verify_field_types: true }
  );
  runTests(
    'function_json_pretty.sql',
    path.join(__dirname, 'function_json_pretty.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_json_pretty_error.sql',
    path.join(__dirname, 'function_json_pretty_error.sql'),
    { allowedErrors: 'SAME_CODE', verify_field_types: true }
  );
  runTests(
    'function_json_search.sql',
    path.join(__dirname, 'function_json_search.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_json_search_error.sql',
    path.join(__dirname, 'function_json_search_error.sql'),
    { allowedErrors: 'SAME_CODE', verify_field_types: true }
  );
  runTests(
    'function_json_value.sql',
    path.join(__dirname, 'function_json_value.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_json_value_error.sql',
    path.join(__dirname, 'function_json_value_error.sql'),
    { allowedErrors: 'SAME_CODE', verify_field_types: true }
  );
  runTests(
    'function_json_storage_free.sql',
    path.join(__dirname, 'function_json_storage_free.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_json_storage_free_error.sql',
    path.join(__dirname, 'function_json_storage_free_error.sql'),
    { allowedErrors: 'SAME_CODE', verify_field_types: true }
  );
  runTests(
    'function_json_storage_size.sql',
    path.join(__dirname, 'function_json_storage_size.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_json_storage_size_error.sql',
    path.join(__dirname, 'function_json_storage_size_error.sql'),
    { allowedErrors: 'SAME_CODE', verify_field_types: true }
  );
  runTests('function_inet.sql', path.join(__dirname, 'function_inet.sql'), {
    verify_field_types: true,
  });
  runTests(
    'function_truncate_rand.sql',
    path.join(__dirname, 'function_truncate_rand.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_aggregate_stats.sql',
    path.join(__dirname, 'function_aggregate_stats.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_aggregate_bitwise.sql',
    path.join(__dirname, 'function_aggregate_bitwise.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_json_agg.sql',
    path.join(__dirname, 'function_json_agg.sql'),
    { verify_field_types: true }
  );
  runTests(
    'function_json_agg_error.sql',
    path.join(__dirname, 'function_json_agg_error.sql'),
    { allowedErrors: 'SAME_CODE', verify_field_types: true }
  );
  runTests(
    'operator_control_flow.sql',
    path.join(__dirname, 'operator_control_flow.sql'),
    { verify_field_types: true }
  );
  runTests('collation.sql', path.join(__dirname, 'collation.sql'), {
    verify_field_types: true,
  });
  runTests('collation_error.sql', path.join(__dirname, 'collation_error.sql'), {
    allowedErrors: 'SAME_CODE',
    verify_field_types: true,
  });
  runTests('case.sql', path.join(__dirname, 'case.sql'), {
    verify_field_types: true,
  });
  runTests(
    'exponent_literal_types.sql',
    path.join(__dirname, 'exponent_literal_types.sql'),
    { verify_field_types: true }
  );
  runTests(
    'null_and_text_arithmetic.sql',
    path.join(__dirname, 'null_and_text_arithmetic.sql'),
    { verify_field_types: true }
  );
});
