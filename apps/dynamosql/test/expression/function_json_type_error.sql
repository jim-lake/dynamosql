SELECT JSON_TYPE('x') AS string_value;
SELECT JSON_TYPE('') AS string_value;
SELECT JSON_TYPE('[1') AS string_value;
SELECT JSON_TYPE(5) AS string_value;
SELECT JSON_TYPE(1.5) AS string_value;
SELECT JSON_TYPE(TRUE) AS string_value;
SELECT JSON_TYPE(CURDATE()) AS string_value;
SELECT JSON_TYPE('[1]', '$') AS string_value;
SELECT JSON_TYPE() AS string_value;
