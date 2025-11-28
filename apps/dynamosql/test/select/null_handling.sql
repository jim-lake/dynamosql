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
