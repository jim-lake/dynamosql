-- JSON_ARRAY tests
SELECT JSON_ARRAY() AS json_array_empty;
SELECT JSON_ARRAY(1, 2, 3) AS json_array_ints;
SELECT JSON_ARRAY('a', 'b') AS json_array_strings;
SELECT JSON_ARRAY(1, 'a', NULL, TRUE, FALSE) AS json_array_mixed;
SELECT JSON_ARRAY(NULL) AS json_array_null;
SELECT JSON_ARRAY(1.5, 2.25) AS json_array_decimals;
SELECT JSON_ARRAY(-7) AS json_array_negative;
SELECT JSON_ARRAY('say "hi"') AS json_array_quotes;
SELECT JSON_ARRAY(JSON_ARRAY(1, 2), 3) AS json_array_nested;
SELECT JSON_ARRAY(JSON_ARRAY()) AS json_array_nested_empty;
SELECT JSON_ARRAY(NULL, NULL) AS json_array_nulls;

-- JSON_ARRAY_APPEND tests
SELECT JSON_ARRAY_APPEND('[1, 2]', '$', 3) AS append_root;
SELECT JSON_ARRAY_APPEND('{"a": [1]}', '$.a', 2) AS append_key;
SELECT JSON_ARRAY_APPEND('{"a": 1}', '$.a', 2) AS append_scalar_to_array;
SELECT JSON_ARRAY_APPEND('{"a": {"b": []}}', '$.a.b', 'x') AS append_nested_key;
SELECT JSON_ARRAY_APPEND('[1, [2, 3]]', '$[1]', 4) AS append_index;
SELECT JSON_ARRAY_APPEND('[1, 2]', '$[0]', 9) AS append_index_scalar;
SELECT JSON_ARRAY_APPEND('[1, 2]', '$[last]', 3) AS append_last;
SELECT JSON_ARRAY_APPEND('[1, 2, 3]', '$[last-1]', 9) AS append_last_minus;
SELECT JSON_ARRAY_APPEND('[1, 2]', '$[5]', 9) AS append_missing_index;
SELECT JSON_ARRAY_APPEND('{"a": [1]}', '$.b', 2) AS append_missing_key;
SELECT JSON_ARRAY_APPEND('[1]', '$', 2, '$', 3) AS append_multiple_pairs;
SELECT JSON_ARRAY_APPEND('[1]', '$', NULL) AS append_null_value;
SELECT JSON_ARRAY_APPEND('[1]', '$', JSON_ARRAY(2, 3)) AS append_json_value;
SELECT JSON_ARRAY_APPEND('[1]', '$', 'text', '$', 1.5) AS append_mixed_types;
SELECT JSON_ARRAY_APPEND(NULL, '$', 1) AS append_null_doc;
SELECT JSON_ARRAY_APPEND('[1]', NULL, 1) AS append_null_path;
SELECT JSON_ARRAY_APPEND('[1]', '$') AS append_missing_value;
SELECT JSON_ARRAY_APPEND('[1]', '$[*]', 2) AS append_wildcard;
SELECT JSON_ARRAY_APPEND('[1]', 'a', 2) AS append_bad_path;
SELECT JSON_ARRAY_APPEND('not json', '$', 1) AS append_bad_doc;
