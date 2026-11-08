SELECT JSON_REMOVE('"x"', '$') AS json_value;
SELECT JSON_REMOVE('{"a":1}', '$') AS json_value;
SELECT JSON_REMOVE('{"a":1,"b":2}', '$.b', 'bad') AS json_value;
SELECT JSON_REMOVE('{"a":1}', '$.*') AS json_value;
SELECT JSON_REMOVE('{"a":1}', 'a') AS json_value;
SELECT JSON_REMOVE('not json', '$.a') AS json_value;
SELECT JSON_REMOVE('{"a":1}') AS json_value;
