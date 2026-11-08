SELECT JSON_UNQUOTE('"a\\qb"') AS string_value;
SELECT JSON_UNQUOTE('"a"b"') AS string_value;
SELECT JSON_UNQUOTE('"\\u12"') AS string_value;
SELECT JSON_UNQUOTE(5) AS string_value;
SELECT JSON_UNQUOTE(1.5) AS string_value;
SELECT JSON_UNQUOTE(TRUE) AS string_value;
SELECT JSON_UNQUOTE('a', 'b') AS string_value;
SELECT JSON_UNQUOTE() AS string_value;
