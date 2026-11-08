SELECT JSON_INSERT('{"a":1}', '$.b') AS json_value;
SELECT JSON_INSERT('{"a":1}') AS json_value;
SELECT JSON_INSERT('{"a":1}', 'b', 2) AS json_value;
SELECT JSON_INSERT('{"a":1}', '$.*', 2) AS json_value;
SELECT JSON_INSERT('not json', '$.a', 1) AS json_value;
