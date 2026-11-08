-- JSON_KEYS tests
SELECT JSON_KEYS('{"a":1,"b":{"c":2}}') AS json_unsorted_array;
SELECT JSON_KEYS('{}') AS json_unsorted_array;
SELECT JSON_KEYS('{"ab":1,"c":2,"aa":3,"B":4}') AS json_unsorted_array;
SELECT JSON_KEYS('{"b":1,"a":2}') AS json_unsorted_array;
SELECT JSON_KEYS('{"é":1,"a b":2}') AS json_unsorted_array;
SELECT JSON_KEYS('{"a":1,"a":2}') AS json_unsorted_array;
SELECT JSON_KEYS('[1,2]') AS json_value;
SELECT JSON_KEYS('[{"a":1}]') AS json_value;
SELECT JSON_KEYS('5') AS json_value;
SELECT JSON_KEYS('"x"') AS json_value;
SELECT JSON_KEYS('null') AS json_value;
SELECT JSON_KEYS(NULL) AS json_value;
SELECT JSON_KEYS('{"a":{"x":1,"y":2}}', '$.a') AS json_unsorted_array;
SELECT JSON_KEYS('{"a":{"zz":1,"y":2}}', '$.a') AS json_unsorted_array;
SELECT JSON_KEYS('{"a":{}}', '$.a') AS json_unsorted_array;
SELECT JSON_KEYS('{"a":{"b":1}}', '$.a.b') AS json_value;
SELECT JSON_KEYS('{"a":[1]}', '$.a') AS json_value;
SELECT JSON_KEYS('{"a":1}', '$') AS json_unsorted_array;
SELECT JSON_KEYS('{"a":1}', '$.a') AS json_value;
SELECT JSON_KEYS('{"a":1}', '$.b') AS json_value;
SELECT JSON_KEYS('{"a":1}', '$[0]') AS json_value;
SELECT JSON_KEYS('[{"a":1}]', '$[0]') AS json_unsorted_array;
SELECT JSON_KEYS('{"a":1}', NULL) AS json_value;
SELECT JSON_KEYS(CAST('{"a":1}' AS JSON)) AS json_unsorted_array;
SELECT JSON_KEYS(JSON_ARRAY(1, 2)) AS json_value;

