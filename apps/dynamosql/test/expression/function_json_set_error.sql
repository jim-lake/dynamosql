SELECT JSON_SET('{"a":1}', '$.a', 2, '$.a', 3, '$.c') AS json_value;
SELECT JSON_SET('{"a":1}', '$.a') AS json_value;
SELECT JSON_SET('{"a":1}') AS json_value;
SELECT JSON_SET('{"a":1}', '$.a', 2, '$.b') AS json_value;
SELECT JSON_SET('{"a":1}', 'a', 2) AS json_value;
SELECT JSON_SET('{"a":1}', '$.*', 2) AS json_value;
SELECT JSON_SET('{"a":1}', '$[*]', 2) AS json_value;
SELECT JSON_SET('not json', '$.a', 1) AS json_value;
