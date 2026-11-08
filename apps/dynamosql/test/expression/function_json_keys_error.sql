SELECT JSON_KEYS('{"a":1}', 'a') AS json_value;
SELECT JSON_KEYS('{"a":1}', '$.*') AS json_value;
SELECT JSON_KEYS('not json') AS json_value;
SELECT JSON_KEYS(5) AS json_value;
SELECT JSON_KEYS(TRUE) AS json_value;
SELECT JSON_KEYS(CURDATE()) AS json_value;
SELECT JSON_KEYS('{"a":1}', '$.a', '$.a') AS json_value;
SELECT JSON_KEYS() AS json_value;
