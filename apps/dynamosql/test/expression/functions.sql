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
