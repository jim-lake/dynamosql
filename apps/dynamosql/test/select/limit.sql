-- LIMIT tests
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id LIMIT 1;
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id LIMIT 2;
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id LIMIT 3;
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id LIMIT 0;
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id LIMIT 100;

-- LIMIT with OFFSET
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id LIMIT 1 OFFSET 0;
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id LIMIT 1 OFFSET 1;
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id LIMIT 1 OFFSET 2;
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id LIMIT 2 OFFSET 1;
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id LIMIT 2 OFFSET 2;
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id LIMIT 3 OFFSET 3;
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id LIMIT 10 OFFSET 5;
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id LIMIT 0 OFFSET 0;
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id LIMIT 0 OFFSET 5;

-- LIMIT with WHERE
SELECT id, other FROM _dynamodb.foo WHERE other > 100 ORDER BY id LIMIT 2;
SELECT id, other FROM _dynamodb.foo WHERE other < 100 ORDER BY id LIMIT 3;
SELECT id, other FROM _dynamodb.foo WHERE other IS NOT NULL ORDER BY id LIMIT 2 OFFSET 1;

-- LIMIT with GROUP BY
SELECT other, SUM(id) FROM _dynamodb.foo GROUP BY other ORDER BY other LIMIT 2;
SELECT other, SUM(id) FROM _dynamodb.foo GROUP BY other ORDER BY other LIMIT 1 OFFSET 1;
SELECT comment, SUM(other) FROM _dynamodb.foo GROUP BY comment ORDER BY comment LIMIT 3;
