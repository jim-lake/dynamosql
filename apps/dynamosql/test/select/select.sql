SELECT * FROM _dynamodb.foo ORDER BY id;
SELECT * FROM _dynamodb.foo ORDER BY id ASC;
SELECT * FROM _dynamodb.foo ORDER BY id DESC;
SELECT id AS dumb FROM _dynamodb.foo ORDER BY dumb;
SELECT id AS dumb FROM _dynamodb.foo ORDER BY 1;

SELECT id, other FROM _dynamodb.foo WHERE other > 10 ORDER BY 1;
SELECT id, other FROM _dynamodb.foo WHERE other < 10 ORDER BY 1;
SELECT id, other FROM _dynamodb.foo WHERE other > 4 ORDER BY 1;
SELECT id, other FROM _dynamodb.foo WHERE other < 4 ORDER BY 1;

SELECT id, other FROM _dynamodb.foo WHERE other >= 10 ORDER BY 1;
SELECT id, other FROM _dynamodb.foo WHERE other <= 10 ORDER BY 1;
SELECT id, other FROM _dynamodb.foo WHERE other >= 4 ORDER BY 1;
SELECT id, other FROM _dynamodb.foo WHERE other <= 4 ORDER BY 1;


SELECT id, other FROM _dynamodb.foo WHERE other = 4 ORDER BY 1;
SELECT id, other FROM _dynamodb.foo WHERE other != 4 ORDER BY 1;
SELECT id, other FROM _dynamodb.foo WHERE other = 5 ORDER BY 1;
SELECT id, other FROM _dynamodb.foo WHERE other != 5 ORDER BY 1;
SELECT id, other FROM _dynamodb.foo WHERE other = 222 ORDER BY 1;
SELECT id, other FROM _dynamodb.foo WHERE other != 222 ORDER BY 1;

SELECT other FROM _dynamodb.foo GROUP BY other ORDER BY other;
SELECT other FROM _dynamodb.foo GROUP BY other ORDER BY 1;
SELECT other FROM _dynamodb.foo GROUP BY 1 ORDER BY other;
SELECT other FROM _dynamodb.foo GROUP BY 1 ORDER BY 1;

SELECT comment, SUM(id) FROM _dynamodb.foo GROUP BY comment ORDER BY comment;
