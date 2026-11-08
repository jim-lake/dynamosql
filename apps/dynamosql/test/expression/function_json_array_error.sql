SELECT JSON_ARRAY_APPEND('[1]', '$') AS json_value;
SELECT JSON_ARRAY_APPEND('[1]', '$[*]', 2) AS json_value;
SELECT JSON_ARRAY_APPEND('[1]', 'a', 2) AS json_value;
SELECT JSON_ARRAY_APPEND('not json', '$', 1) AS json_value;
