-- JSON_QUOTE tests
SELECT JSON_QUOTE('abc') AS string_value;
SELECT JSON_QUOTE('') AS string_value;
SELECT JSON_QUOTE('say "hi"') AS string_value;
SELECT JSON_QUOTE('back\\slash') AS string_value;
SELECT JSON_QUOTE('tab\there') AS string_value;
SELECT JSON_QUOTE('new\nline') AS string_value;
SELECT JSON_QUOTE('a/b') AS string_value;
SELECT JSON_QUOTE('é') AS string_value;
SELECT JSON_QUOTE('"') AS string_value;
SELECT JSON_QUOTE(NULL) AS string_value;
SELECT JSON_QUOTE(CAST('x' AS CHAR)) AS string_value;
SELECT JSON_QUOTE(JSON_QUOTE('a')) AS string_value;
