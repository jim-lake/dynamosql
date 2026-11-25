-- JSON_VALUE tests
SELECT JSON_VALUE('{"a":1}', '$.a') AS result;
SELECT JSON_VALUE('{"a":"s"}', '$.a') AS result;
SELECT JSON_VALUE('{"a":1.50}', '$.a') AS result;
SELECT JSON_VALUE('{"a":true}', '$.a') AS result;
SELECT JSON_VALUE('{"a":false}', '$.a') AS result;
SELECT JSON_VALUE('{"a":null}', '$.a') AS result;
SELECT JSON_VALUE('{"a":"12345678901234567890"}', '$.a') AS result;
SELECT JSON_VALUE('{"a":"x"}', '$.b') AS result;
SELECT JSON_VALUE('{"a":1}', '$.b') AS result;
SELECT JSON_VALUE('[1,2]', '$[1]') AS result;
SELECT JSON_VALUE('[1,2]', '$[last]') AS result;
SELECT JSON_VALUE('[1,2]', '$[last-1]') AS result;
SELECT JSON_VALUE('[1,2]', '$[5]') AS result;
SELECT JSON_VALUE('["é"]', '$[0]') AS result;
SELECT JSON_VALUE('{"a":[1]}', '$.a[0]') AS result;
SELECT JSON_VALUE('"str"', '$') AS result;
SELECT JSON_VALUE('5', '$') AS result;
SELECT JSON_VALUE('{"a":"x"}', '$.a') = 'x' AS result;
SELECT JSON_VALUE(JSON_OBJECT('a', 'é'), '$.a') AS result;
SELECT JSON_VALUE(CAST('{"a":"x"}' AS JSON), '$.a') AS result;
SELECT JSON_VALUE(JSON_ARRAY(1, 2), '$[0]') AS result;
SELECT JSON_VALUE(NULL, '$.a') AS result;
SELECT JSON_VALUE('not json', '$.a') AS result;

-- JSON_VALUE with RETURNING type spellings
SELECT JSON_VALUE('{"i":5}', '$.i' RETURNING SIGNED INTEGER) AS result;
SELECT JSON_VALUE('{"i":-5}', '$.i' RETURNING SIGNED INTEGER) AS result;
SELECT JSON_VALUE('{"i":5}', '$.i' RETURNING UNSIGNED INTEGER) AS result;
SELECT JSON_VALUE('{"i":5}', '$.i' RETURNING UNSIGNED) AS result;
SELECT JSON_VALUE('{"s":"abc"}', '$.s' RETURNING CHAR(3) CHARACTER SET utf8mb4) AS result;
SELECT JSON_VALUE('{"s":"ab"}', '$.s' RETURNING CHAR(3) CHARACTER SET utf8mb4) AS result;
SELECT JSON_VALUE('{"s":"abcdef"}', '$.s' RETURNING CHAR(3) CHARACTER SET utf8mb4) AS result;
