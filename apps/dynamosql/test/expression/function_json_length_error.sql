SELECT JSON_LENGTH('[1,2]', '$[1]x') AS json_value;
SELECT JSON_LENGTH('[1,2]', '$[1') AS json_value;
SELECT JSON_LENGTH('[1,2]', '$.') AS json_value;
SELECT JSON_LENGTH('[1,2]', 'a') AS json_value;
SELECT JSON_LENGTH('[1,2]', '$', '$') AS json_value;
SELECT JSON_LENGTH('[1,2]', '') AS json_value;
SELECT JSON_LENGTH('not json') AS json_value;
