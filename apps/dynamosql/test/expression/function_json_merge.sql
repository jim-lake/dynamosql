-- JSON_MERGE tests
SELECT JSON_MERGE('{"a":1}', '{"a":2,"b":3}') AS json_value;
SELECT JSON_MERGE('[1]', '2') AS json_value;
SELECT JSON_MERGE('[1,2]', '[3]', '{"a":1}') AS json_value;
SELECT JSON_MERGE('{"a":1}') AS json_value;
SELECT JSON_MERGE('{"a":1}', NULL) AS json_value;
SELECT JSON_MERGE('{"a":1}', 'x') AS json_value;
