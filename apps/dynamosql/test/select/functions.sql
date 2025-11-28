-- COALESCE with columns
SELECT id, COALESCE(other, 0) AS other_or_zero FROM _dynamodb.foo ORDER BY id;
SELECT id, COALESCE(other, 999) AS other_or_999 FROM _dynamodb.foo ORDER BY id;
SELECT id, COALESCE(comment, "no comment") AS comment_or_default FROM _dynamodb.foo ORDER BY id;
SELECT id, COALESCE(other, id) AS result FROM _dynamodb.foo ORDER BY id;

-- IFNULL with columns
SELECT id, IFNULL(other, 0) AS other_or_zero FROM _dynamodb.foo ORDER BY id;
SELECT id, IFNULL(other, 999) AS other_or_999 FROM _dynamodb.foo ORDER BY id;
SELECT id, IFNULL(comment, "no comment") AS comment_or_default FROM _dynamodb.foo ORDER BY id;
SELECT id, IFNULL(other, id) AS result FROM _dynamodb.foo ORDER BY id;

-- CONCAT with columns
SELECT CONCAT(id, "-", other) AS result FROM _dynamodb.foo WHERE other IS NOT NULL ORDER BY id;
SELECT CONCAT(id, ":", comment) AS result FROM _dynamodb.foo ORDER BY id;
SELECT CONCAT("ID=", id, " OTHER=", other) AS result FROM _dynamodb.foo WHERE other IS NOT NULL ORDER BY id;

-- LOWER with columns
SELECT id, LOWER(comment) AS lower_comment FROM _dynamodb.foo ORDER BY id;
SELECT LOWER(comment) AS lc FROM _dynamodb.foo WHERE id = "111";

-- UPPER with columns
SELECT id, UPPER(comment) AS upper_comment FROM _dynamodb.foo ORDER BY id;
SELECT UPPER(comment) AS uc FROM _dynamodb.foo WHERE id = "111";

-- LENGTH with columns
SELECT id, LENGTH(comment) AS comment_length FROM _dynamodb.foo ORDER BY id;
SELECT id, comment FROM _dynamodb.foo WHERE LENGTH(comment) > 15 ORDER BY id;

-- LEFT with columns
SELECT id, LEFT(comment, 5) AS short_comment FROM _dynamodb.foo ORDER BY id;
SELECT id, LEFT(comment, other) AS result FROM _dynamodb.foo WHERE other IS NOT NULL ORDER BY id;

-- RIGHT with columns
SELECT id, RIGHT(comment, 5) AS short_comment FROM _dynamodb.foo ORDER BY id;
SELECT id, RIGHT(comment, other) AS result FROM _dynamodb.foo WHERE other IS NOT NULL ORDER BY id;

-- TRIM with columns
SELECT id, TRIM(comment) AS trimmed_comment FROM _dynamodb.foo ORDER BY id;

-- REVERSE with columns
SELECT id, REVERSE(comment) AS reversed FROM _dynamodb.foo ORDER BY id;
