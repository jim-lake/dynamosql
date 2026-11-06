-- Arithmetic result type when an operand is NULL takes the operand types, not the NULL value
SELECT CASE WHEN 0 THEN 10 END + 1 AS result;
SELECT IF(0, 10, NULL) + 1 AS result;
SELECT CAST(NULL AS SIGNED) + 1 AS result;
SELECT CAST(NULL AS SIGNED) - 2 AS result;
SELECT CAST(NULL AS SIGNED) * 2 AS result;
SELECT CAST(NULL AS SIGNED) / 2 AS result;
SELECT CAST(NULL AS SIGNED) DIV 2 AS result;
SELECT CAST(NULL AS SIGNED) % 2 AS result;
SELECT 1 + CAST(NULL AS SIGNED) AS result;
SELECT CAST(NULL AS SIGNED) + NULL AS result;
SELECT NULL % 2 AS result;
SELECT CASE WHEN 0 THEN 10 END + 1.5 AS result;
SELECT CASE WHEN 0 THEN 1.5 END + 1 AS result;
SELECT CAST(NULL AS DECIMAL(5,2)) + 1 AS result;
SELECT CAST(NULL AS DOUBLE) + 1 AS result;
SELECT CAST(NULL AS CHAR) + 1 AS result;

-- Text results are arithmetic on strings and give DOUBLE
SELECT JSON_UNQUOTE(JSON_EXTRACT('{"a":1}', '$.a')) + 1 AS result;
SELECT JSON_UNQUOTE(JSON_EXTRACT('{"a":1}', '$.a')) % 2 AS result;
SELECT CONCAT('1', '') + 1 AS result;
SELECT CAST('1' AS CHAR) + 1 AS result;
