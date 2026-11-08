SELECT JSON_CONTAINS_PATH('{"a":1}', 'x', NULL) AS json_value;
SELECT JSON_CONTAINS_PATH('{"a":1}', 'x', '$.a') AS json_value;
SELECT JSON_CONTAINS_PATH('not json', 'one', '$') AS json_value;
SELECT JSON_CONTAINS_PATH('[1,2]', 'one', '$[1]x') AS json_value;
SELECT JSON_CONTAINS_PATH('[1,2]', 'one', '') AS json_value;
SELECT JSON_CONTAINS_PATH('{"a":1}', 'one') AS json_value;
SELECT JSON_CONTAINS_PATH('{"a":1}', 'one', 5) AS json_value;
