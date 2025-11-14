-- NULL comparisons
SELECT NULL = NULL AS result;
SELECT NULL != NULL AS result;
SELECT NULL <> NULL AS result;
SELECT NULL < NULL AS result;
SELECT NULL > NULL AS result;
SELECT NULL <= NULL AS result;
SELECT NULL >= NULL AS result;

-- NULL with values
SELECT 5 = NULL AS result;
SELECT NULL = 5 AS result;
SELECT 5 != NULL AS result;
SELECT NULL != 5 AS result;
SELECT 5 < NULL AS result;
SELECT NULL < 5 AS result;
SELECT 5 > NULL AS result;
SELECT NULL > 5 AS result;

-- IS NULL / IS NOT NULL
SELECT NULL IS NULL AS result;
SELECT NULL IS NOT NULL AS result;
SELECT 5 IS NULL AS result;
SELECT 5 IS NOT NULL AS result;
SELECT 0 IS NULL AS result;
SELECT 0 IS NOT NULL AS result;
SELECT "" IS NULL AS result;
SELECT "" IS NOT NULL AS result;

-- NULL in arithmetic
SELECT NULL + 5 AS result;
SELECT 5 + NULL AS result;
SELECT NULL - 5 AS result;
SELECT 5 - NULL AS result;
SELECT NULL * 5 AS result;
SELECT 5 * NULL AS result;
SELECT NULL / 5 AS result;
SELECT 5 / NULL AS result;

-- NULL in string functions
SELECT CONCAT("hello", NULL) AS result;
SELECT CONCAT(NULL, "world") AS result;
SELECT CONCAT(NULL, NULL) AS result;
SELECT LENGTH(NULL) AS result;
SELECT LOWER(NULL) AS result;
SELECT LEFT(NULL, 5) AS result;
SELECT LEFT("hello", NULL) AS result;

-- NULL with COALESCE
SELECT COALESCE(NULL) AS result;
SELECT COALESCE(NULL, NULL) AS result;
SELECT COALESCE(NULL, NULL, NULL) AS result;
SELECT COALESCE(NULL, 5) AS result;
SELECT COALESCE(5, NULL) AS result;
SELECT COALESCE(NULL, NULL, 10) AS result;

-- NULL with IFNULL
SELECT IFNULL(NULL, 5) AS result;
SELECT IFNULL(5, NULL) AS result;
SELECT IFNULL(NULL, NULL) AS result;

-- NULL in WHERE with columns
SELECT id, other FROM _dynamodb.foo WHERE other IS NULL ORDER BY id;
SELECT id, other FROM _dynamodb.foo WHERE other IS NOT NULL ORDER BY id;
SELECT id, comment FROM _dynamodb.foo WHERE comment IS NULL ORDER BY id;
SELECT id, comment FROM _dynamodb.foo WHERE comment IS NOT NULL ORDER BY id;

-- NULL in expressions with columns
SELECT id, other, COALESCE(other, -1) AS other_or_neg1 FROM _dynamodb.foo ORDER BY id;
SELECT id, other, IFNULL(other, -1) AS other_or_neg1 FROM _dynamodb.foo ORDER BY id;
SELECT id, other, other + 10 AS plus_ten FROM _dynamodb.foo ORDER BY id;
SELECT id, comment, CONCAT("prefix:", comment) AS prefixed FROM _dynamodb.foo ORDER BY id;

-- NULL in ORDER BY
SELECT id, other FROM _dynamodb.foo ORDER BY other, id;
SELECT id, other FROM _dynamodb.foo ORDER BY other DESC, id;
SELECT id, other FROM _dynamodb.foo ORDER BY other ASC, id;
