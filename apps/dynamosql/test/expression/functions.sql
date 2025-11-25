-- COALESCE tests
SELECT COALESCE(NULL, 1) AS result;
SELECT COALESCE(NULL, NULL, 2) AS result;
SELECT COALESCE(1, 2) AS result;
SELECT COALESCE(NULL, NULL, NULL, 3) AS result;
SELECT COALESCE("foo", "bar") AS result;
SELECT COALESCE(NULL, "bar") AS result;
SELECT COALESCE(NULL, NULL, "baz") AS result;

-- COALESCE with columns
SELECT id, COALESCE(other, 0) AS other_or_zero FROM _dynamodb.foo ORDER BY id;
SELECT id, COALESCE(other, 999) AS other_or_999 FROM _dynamodb.foo ORDER BY id;
SELECT id, COALESCE(comment, "no comment") AS comment_or_default FROM _dynamodb.foo ORDER BY id;
SELECT id, COALESCE(other, id) AS result FROM _dynamodb.foo ORDER BY id;

-- IFNULL tests
SELECT IFNULL(NULL, 1) AS result;
SELECT IFNULL(2, 1) AS result;
SELECT IFNULL(NULL, "default") AS result;
SELECT IFNULL("value", "default") AS result;

-- IFNULL with columns
SELECT id, IFNULL(other, 0) AS other_or_zero FROM _dynamodb.foo ORDER BY id;
SELECT id, IFNULL(other, 999) AS other_or_999 FROM _dynamodb.foo ORDER BY id;
SELECT id, IFNULL(comment, "no comment") AS comment_or_default FROM _dynamodb.foo ORDER BY id;
SELECT id, IFNULL(other, id) AS result FROM _dynamodb.foo ORDER BY id;

-- DATABASE function
SELECT DATABASE() AS current_db;
USE _dynamodb;
SELECT DATABASE() AS current_db;

-- CONCAT tests
SELECT CONCAT("a", "b") AS result;
SELECT CONCAT("a", "b", "c") AS result;
SELECT CONCAT("a", NULL, "c") AS result;
SELECT CONCAT(1, 2, 3) AS result;
SELECT CONCAT("num:", 123) AS result;

-- CONCAT with columns
SELECT CONCAT(id, "-", other) AS result FROM _dynamodb.foo WHERE other IS NOT NULL ORDER BY id;
SELECT CONCAT(id, ":", comment) AS result FROM _dynamodb.foo ORDER BY id;
SELECT CONCAT("ID=", id, " OTHER=", other) AS result FROM _dynamodb.foo WHERE other IS NOT NULL ORDER BY id;

-- LOWER tests
SELECT LOWER("ABC") AS result;
SELECT LOWER("AbC") AS result;
SELECT LOWER("abc") AS result;
SELECT LOWER("123ABC") AS result;
SELECT LOWER(NULL) AS result;

-- LOWER with columns
SELECT id, LOWER(comment) AS lower_comment FROM _dynamodb.foo ORDER BY id;
SELECT LOWER(comment) AS lc FROM _dynamodb.foo WHERE id = "111";

-- UPPER tests
SELECT UPPER("abc") AS result;
SELECT UPPER("AbC") AS result;
SELECT UPPER("ABC") AS result;
SELECT UPPER("123abc") AS result;
SELECT UPPER(NULL) AS result;

-- UPPER with columns
SELECT id, UPPER(comment) AS upper_comment FROM _dynamodb.foo ORDER BY id;
SELECT UPPER(comment) AS uc FROM _dynamodb.foo WHERE id = "111";

-- LENGTH tests
SELECT LENGTH("") AS result;
SELECT LENGTH("a") AS result;
SELECT LENGTH("abc") AS result;
SELECT LENGTH("hello world") AS result;
SELECT LENGTH(NULL) AS result;

-- LENGTH with columns
SELECT id, LENGTH(comment) AS comment_length FROM _dynamodb.foo ORDER BY id;
SELECT id, comment FROM _dynamodb.foo WHERE LENGTH(comment) > 15 ORDER BY id;

-- LEFT tests
SELECT LEFT("hello", 3) AS result;
SELECT LEFT("hello", 10) AS result;
SELECT LEFT("hello", 0) AS result;
SELECT LEFT("hello", -1) AS result;
SELECT LEFT(NULL, 3) AS result;
SELECT LEFT("hello", NULL) AS result;

-- LEFT with columns
SELECT id, LEFT(comment, 5) AS short_comment FROM _dynamodb.foo ORDER BY id;
SELECT id, LEFT(comment, other) AS result FROM _dynamodb.foo WHERE other IS NOT NULL ORDER BY id;

-- RIGHT tests
SELECT RIGHT("hello", 3) AS result;
SELECT RIGHT("hello", 10) AS result;
SELECT RIGHT("hello", 0) AS result;
SELECT RIGHT("hello", -1) AS result;
SELECT RIGHT(NULL, 3) AS result;
SELECT RIGHT("hello", NULL) AS result;

-- RIGHT with columns
SELECT id, RIGHT(comment, 5) AS short_comment FROM _dynamodb.foo ORDER BY id;
SELECT id, RIGHT(comment, other) AS result FROM _dynamodb.foo WHERE other IS NOT NULL ORDER BY id;

-- TRIM tests
SELECT TRIM("  hello  ") AS result;
SELECT TRIM("hello") AS result;
SELECT TRIM("  ") AS result;
SELECT TRIM("") AS result;
SELECT TRIM(NULL) AS result;

-- TRIM with columns
SELECT id, TRIM(comment) AS trimmed_comment FROM _dynamodb.foo ORDER BY id;

-- LTRIM tests
SELECT LTRIM("  hello") AS result;
SELECT LTRIM("hello") AS result;
SELECT LTRIM("  ") AS result;
SELECT LTRIM("") AS result;
SELECT LTRIM(NULL) AS result;

-- RTRIM tests
SELECT RTRIM("hello  ") AS result;
SELECT RTRIM("hello") AS result;
SELECT RTRIM("  ") AS result;
SELECT RTRIM("") AS result;
SELECT RTRIM(NULL) AS result;

-- REVERSE tests
SELECT REVERSE("hello") AS result;
SELECT REVERSE("abc") AS result;
SELECT REVERSE("") AS result;
SELECT REVERSE(NULL) AS result;

-- REVERSE with columns
SELECT id, REVERSE(comment) AS reversed FROM _dynamodb.foo ORDER BY id;

-- REPEAT tests
SELECT REPEAT("abc", 3) AS result;
SELECT REPEAT("x", 5) AS result;
SELECT REPEAT("a", 0) AS result;
SELECT REPEAT("a", 1) AS result;
SELECT REPEAT(NULL, 3) AS result;
SELECT REPEAT("a", NULL) AS result;

-- CHAR_LENGTH tests
SELECT CHAR_LENGTH("hello") AS result;
SELECT CHAR_LENGTH("") AS result;
SELECT CHAR_LENGTH("abc") AS result;
SELECT CHAR_LENGTH(NULL) AS result;

-- CHARACTER_LENGTH tests
SELECT CHARACTER_LENGTH("hello") AS result;
SELECT CHARACTER_LENGTH("") AS result;

-- ABS tests
SELECT ABS(-5) AS result;
SELECT ABS(5) AS result;
SELECT ABS(0) AS result;
SELECT ABS(-3.14) AS result;
SELECT ABS(3.14) AS result;
SELECT ABS(NULL) AS result;

-- ABS with columns
SELECT id, ABS(other) AS abs_other FROM _dynamodb.foo WHERE other IS NOT NULL ORDER BY id;

-- CEIL tests
SELECT CEIL(3.14) AS result;
SELECT CEIL(3.99) AS result;
SELECT CEIL(-3.14) AS result;
SELECT CEIL(5) AS result;
SELECT CEIL(NULL) AS result;

-- CEILING tests
SELECT CEILING(3.14) AS result;
SELECT CEILING(-3.14) AS result;

-- FLOOR tests
SELECT FLOOR(3.14) AS result;
SELECT FLOOR(3.99) AS result;
SELECT FLOOR(-3.14) AS result;
SELECT FLOOR(5) AS result;
SELECT FLOOR(NULL) AS result;

-- ROUND tests
SELECT ROUND(3.14) AS result;
SELECT ROUND(3.5) AS result;
SELECT ROUND(3.99) AS result;
SELECT ROUND(3.14159, 2) AS result;
SELECT ROUND(3.14159, 0) AS result;
SELECT ROUND(NULL) AS result;

-- MOD tests
SELECT MOD(10, 3) AS result;
SELECT MOD(10, 4) AS result;
SELECT MOD(-10, 3) AS result;
SELECT MOD(NULL, 3) AS result;
SELECT MOD(10, NULL) AS result;

-- POW tests
SELECT POW(2, 3) AS result;
SELECT POW(5, 2) AS result;
SELECT POW(2, 0) AS result;
SELECT POW(NULL, 2) AS result;
SELECT POW(2, NULL) AS result;

-- POWER tests
SELECT POWER(2, 3) AS result;
SELECT POWER(5, 2) AS result;

-- SQRT tests
SELECT SQRT(4) AS result;
SELECT SQRT(9) AS result;
SELECT SQRT(2) AS result;
SELECT SQRT(NULL) AS result;

-- SIGN tests
SELECT SIGN(-5) AS result;
SELECT SIGN(0) AS result;
SELECT SIGN(5) AS result;
SELECT SIGN(NULL) AS result;

-- GREATEST tests
SELECT GREATEST(1, 2, 3) AS result;
SELECT GREATEST(5, 2, 8, 1) AS result;
SELECT GREATEST(1, NULL, 3) AS result;
SELECT GREATEST("a", "b", "c") AS result;
SELECT GREATEST("z", "a", "m") AS result;

-- LEAST tests
SELECT LEAST(1, 2, 3) AS result;
SELECT LEAST(5, 2, 8, 1) AS result;
SELECT LEAST(1, NULL, 3) AS result;
SELECT LEAST("a", "b", "c") AS result;
SELECT LEAST("z", "a", "m") AS result;

-- UNIX_TIMESTAMP tests
SELECT UNIX_TIMESTAMP("2024-01-15 10:30:45") AS result;
SELECT UNIX_TIMESTAMP("1970-01-01 00:00:00") AS result;

-- NOT function tests
SELECT NOT(1) AS result;
SELECT NOT(0) AS result;
SELECT NOT(NULL) AS result;
SELECT NOT(5) AS result;
