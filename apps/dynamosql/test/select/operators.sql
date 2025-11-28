-- Arithmetic with columns
SELECT id, other, other + 10 AS plus_ten FROM _dynamodb.foo WHERE other IS NOT NULL ORDER BY id;
SELECT id, other, other - 10 AS minus_ten FROM _dynamodb.foo WHERE other IS NOT NULL ORDER BY id;
SELECT id, other, other * 2 AS doubled FROM _dynamodb.foo WHERE other IS NOT NULL ORDER BY id;
SELECT id, other, other / 2 AS halved FROM _dynamodb.foo WHERE other IS NOT NULL ORDER BY id;

-- Comparison with columns
SELECT id, other FROM _dynamodb.foo WHERE other = 111 ORDER BY id;
SELECT id, other FROM _dynamodb.foo WHERE other != 111 ORDER BY id;
SELECT id, other FROM _dynamodb.foo WHERE other > 200 ORDER BY id;
SELECT id, other FROM _dynamodb.foo WHERE other < 200 ORDER BY id;
SELECT id, other FROM _dynamodb.foo WHERE other >= 222 ORDER BY id;
SELECT id, other FROM _dynamodb.foo WHERE other <= 222 ORDER BY id;
