-- JSON_ARRAY tests
SELECT JSON_ARRAY() AS json_value;
SELECT JSON_ARRAY(1, 2, 3) AS json_value;
SELECT JSON_ARRAY('a', 'b') AS json_value;
SELECT JSON_ARRAY(1, 'a', NULL, TRUE, FALSE) AS json_value;
SELECT JSON_ARRAY(NULL) AS json_value;
SELECT JSON_ARRAY(1.5, 2.25) AS json_value;
SELECT JSON_ARRAY(-7) AS json_value;
SELECT JSON_ARRAY('say "hi"') AS json_value;
SELECT JSON_ARRAY(JSON_ARRAY(1, 2), 3) AS json_value;
SELECT JSON_ARRAY(JSON_ARRAY()) AS json_value;
SELECT JSON_ARRAY(NULL, NULL) AS json_value;

-- JSON_ARRAY_APPEND tests
SELECT JSON_ARRAY_APPEND('[1, 2]', '$', 3) AS json_value;
SELECT JSON_ARRAY_APPEND('{"a": [1]}', '$.a', 2) AS json_value;
SELECT JSON_ARRAY_APPEND('{"a": 1}', '$.a', 2) AS json_value;
SELECT JSON_ARRAY_APPEND('{"a": {"b": []}}', '$.a.b', 'x') AS json_value;
SELECT JSON_ARRAY_APPEND('[1, [2, 3]]', '$[1]', 4) AS json_value;
SELECT JSON_ARRAY_APPEND('[1, 2]', '$[0]', 9) AS json_value;
SELECT JSON_ARRAY_APPEND('[1, 2]', '$[last]', 3) AS json_value;
SELECT JSON_ARRAY_APPEND('[1, 2, 3]', '$[last-1]', 9) AS json_value;
SELECT JSON_ARRAY_APPEND('[1, 2]', '$[5]', 9) AS json_value;
SELECT JSON_ARRAY_APPEND('{"a": [1]}', '$.b', 2) AS json_value;
SELECT JSON_ARRAY_APPEND('[1]', '$', 2, '$', 3) AS json_value;
SELECT JSON_ARRAY_APPEND('[1]', '$', NULL) AS json_value;
SELECT JSON_ARRAY_APPEND('[1]', '$', JSON_ARRAY(2, 3)) AS json_value;
SELECT JSON_ARRAY_APPEND('[1]', '$', 'text', '$', 1.5) AS json_value;
SELECT JSON_ARRAY_APPEND(NULL, '$', 1) AS json_value;
SELECT JSON_ARRAY_APPEND('[1]', NULL, 1) AS json_value;

-- JSON_ARRAY edge cases
SELECT JSON_ARRAY(JSON_ARRAY(JSON_ARRAY(1))) AS json_value;
SELECT JSON_ARRAY(NULL, 'x') AS json_value;
SELECT JSON_ARRAY('') AS json_value;
SELECT JSON_ARRAY(1.0, 1.50, 100.25, 0.0) AS json_value;
SELECT JSON_ARRAY(1e20, -0.5) AS json_value;
SELECT JSON_ARRAY(9007199254740993) AS json_value;
SELECT JSON_ARRAY('say "hi"', 'uni é 中') AS json_value;
SELECT JSON_ARRAY('back\\slash', 'it''s') AS json_value;
SELECT JSON_ARRAY('\n', 'tab\tx', '\/') AS json_value;
SELECT JSON_ARRAY(1 = 1, 1 = 2) AS json_value;
SELECT JSON_ARRAY(1 AND 1) AS json_value;
SELECT JSON_ARRAY(1 OR 0, NOT 0) AS json_value;
SELECT JSON_ARRAY(1 XOR 1) AS json_value;
SELECT JSON_ARRAY(NOT 0, NOT 1) AS json_value;
SELECT JSON_ARRAY(1 IS NULL, 1 IS NOT NULL) AS json_value;
SELECT JSON_ARRAY(1 IN (1, 2), 3 BETWEEN 1 AND 2) AS json_value;
SELECT JSON_ARRAY('a' LIKE 'a', 1 < 2, 2 >= 3) AS json_value;
SELECT JSON_ARRAY((1 = 1)) AS json_value;
SELECT JSON_ARRAY(1 + (1 = 1)) AS json_value;
SELECT JSON_ARRAY(1 + 2, 10 / 4, 7 DIV 2) AS json_value;
SELECT JSON_ARRAY(LENGTH('abc'), UPPER('abc')) AS json_value;
SELECT JSON_ARRAY(CAST('2020-01-02' AS DATE)) AS json_value;
SELECT JSON_ARRAY(CAST('2020-01-02 03:04:05' AS DATETIME)) AS json_value;
SELECT JSON_ARRAY(CAST('03:04:05' AS TIME)) AS json_value;
SELECT JSON_ARRAY(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12) AS json_value;
