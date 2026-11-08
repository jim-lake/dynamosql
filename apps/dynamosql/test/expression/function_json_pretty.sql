-- JSON_PRETTY tests
SELECT JSON_PRETTY('{"a":1}') AS json_value;
SELECT JSON_PRETTY('[1,2,3]') AS json_value;
SELECT JSON_PRETTY('{"a":[1,{}]}') AS json_value;
SELECT JSON_PRETTY('{"a":{"b":{}}}') AS json_value;
SELECT JSON_PRETTY('[[1,2],[3]]') AS json_value;
SELECT JSON_PRETTY('[]') AS json_value;
SELECT JSON_PRETTY('{}') AS json_value;
SELECT JSON_PRETTY('"x"') AS json_value;
SELECT JSON_PRETTY('5') AS json_value;
SELECT JSON_PRETTY('true') AS json_value;
SELECT JSON_PRETTY('null') AS json_value;
SELECT JSON_PRETTY('[1.5,"a\\"b"]') AS json_value;
SELECT JSON_PRETTY(JSON_ARRAY(1, 'a')) AS json_value;
SELECT JSON_PRETTY(JSON_OBJECT('k', 'v')) AS json_value;
SELECT JSON_PRETTY(CAST('[1]' AS JSON)) AS json_value;
SELECT JSON_PRETTY(NULL) AS json_value;
