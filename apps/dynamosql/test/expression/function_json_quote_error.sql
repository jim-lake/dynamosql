SELECT JSON_QUOTE(5) AS string_value;
SELECT JSON_QUOTE(1.5) AS string_value;
SELECT JSON_QUOTE(TRUE) AS string_value;
SELECT JSON_QUOTE(JSON_ARRAY(1)) AS string_value;
SELECT JSON_QUOTE(CURDATE()) AS string_value;
SELECT JSON_QUOTE('a', 'b') AS string_value;
SELECT JSON_QUOTE() AS string_value;
