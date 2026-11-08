SELECT JSON_CONTAINS('[1]', 'x') AS json_value;
SELECT JSON_CONTAINS('x', '1') AS json_value;
SELECT JSON_CONTAINS('[1]', '1', '$[*]') AS json_value;
SELECT JSON_CONTAINS('[1]', '1', 'a') AS json_value;
SELECT JSON_CONTAINS('[1]') AS json_value;
SELECT JSON_CONTAINS('[1]', '1', '$', '$') AS json_value;
