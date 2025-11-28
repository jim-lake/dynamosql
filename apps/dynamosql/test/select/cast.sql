-- CAST with columns
SELECT id, CAST(other AS CHAR) AS other_str FROM _dynamodb.foo WHERE other IS NOT NULL ORDER BY id;
SELECT id, CAST(id AS SIGNED) AS id_num FROM _dynamodb.foo ORDER BY id;

-- CAST in WHERE clause
SELECT id, CAST(other AS DECIMAL) FROM _dynamodb.foo WHERE CAST(id AS SIGNED) > 100 ORDER BY id;
SELECT id, CAST(other AS DECIMAL) FROM _dynamodb.foo WHERE CAST(other AS CHAR) = "111" ORDER BY id;
