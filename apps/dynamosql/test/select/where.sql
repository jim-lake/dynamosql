-- Complex WHERE expressions
SELECT id, other FROM _dynamodb.foo WHERE other > 100 AND other < 300 ORDER BY id;
SELECT id, other FROM _dynamodb.foo WHERE other < 100 OR other > 300 ORDER BY id;
SELECT id, other FROM _dynamodb.foo WHERE (other > 100 AND other < 300) OR other IS NULL ORDER BY id;
SELECT id, other FROM _dynamodb.foo WHERE other >= 111 AND other <= 222 ORDER BY id;
SELECT id, other FROM _dynamodb.foo WHERE NOT (other < 100) ORDER BY id;
SELECT id, other FROM _dynamodb.foo WHERE !(other < 100) ORDER BY id;

-- IS NULL / IS NOT NULL
SELECT id, other FROM _dynamodb.foo WHERE other IS NULL ORDER BY id;
SELECT id, other FROM _dynamodb.foo WHERE other IS NOT NULL ORDER BY id;
SELECT id, comment FROM _dynamodb.foo WHERE comment IS NULL ORDER BY id;
SELECT id, comment FROM _dynamodb.foo WHERE comment IS NOT NULL ORDER BY id;

-- XOR operator
SELECT id, other FROM _dynamodb.foo WHERE (other > 100) XOR (other < 300) ORDER BY id;
SELECT id, other FROM _dynamodb.foo WHERE (other > 200) XOR (other < 100) ORDER BY id;
SELECT id, other FROM _dynamodb.foo WHERE (other IS NULL) XOR (id = "4") ORDER BY id;

-- Complex nested conditions
SELECT id, other FROM _dynamodb.foo WHERE (other > 100 OR other IS NULL) AND id != "99" ORDER BY id;
SELECT id, other FROM _dynamodb.foo WHERE other > 100 AND (id = "111" OR id = "112") ORDER BY id;
SELECT id, other FROM _dynamodb.foo WHERE (other > 100 AND id = "111") OR (other < 10 AND id = "4") ORDER BY id;

-- Arithmetic in WHERE (removed - DynamoDB doesn't support arithmetic in filter expressions)

-- String comparisons
SELECT id, comment FROM _dynamodb.foo WHERE comment = "111 comment" ORDER BY id;
SELECT id, comment FROM _dynamodb.foo WHERE comment != "111 comment" ORDER BY id;
SELECT id, comment FROM _dynamodb.foo WHERE comment < "200" ORDER BY id;
SELECT id, comment FROM _dynamodb.foo WHERE comment > "100" ORDER BY id;
