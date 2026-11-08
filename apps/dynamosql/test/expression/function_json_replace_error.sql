SELECT JSON_REPLACE('{"a":1}', '$.a') AS json_value;
SELECT JSON_REPLACE('{"a":1}') AS json_value;
SELECT JSON_REPLACE('{"a":1}', 'a', 2) AS json_value;
SELECT JSON_REPLACE('{"a":1}', '$.*', 2) AS json_value;
SELECT JSON_REPLACE('not json', '$.a', 1) AS json_value;
