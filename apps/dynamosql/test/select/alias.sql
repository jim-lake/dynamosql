-- Column aliases
SELECT id AS identifier FROM _dynamodb.foo ORDER BY id;
SELECT id AS identifier, other AS value FROM _dynamodb.foo ORDER BY id;
SELECT id identifier FROM _dynamodb.foo ORDER BY id;
SELECT id identifier, other value FROM _dynamodb.foo ORDER BY id;

-- Aliases with expressions
SELECT id, other + 10 AS adjusted FROM _dynamodb.foo ORDER BY id;
SELECT id, other * 2 AS doubled FROM _dynamodb.foo ORDER BY id;
SELECT CONCAT(id, "-", comment) AS combined FROM _dynamodb.foo ORDER BY id;
SELECT LENGTH(comment) AS len FROM _dynamodb.foo ORDER BY id;
SELECT LOWER(comment) AS lower_comment FROM _dynamodb.foo ORDER BY id;

-- Aliases with aggregates
SELECT comment, SUM(other) AS sum_other FROM _dynamodb.foo GROUP BY comment ORDER BY comment;

-- Multiple aliases
SELECT id AS a, other AS b, comment AS c FROM _dynamodb.foo ORDER BY id;

-- Aliases with special characters (backticks)
SELECT id AS `my id` FROM _dynamodb.foo ORDER BY id;
SELECT id AS `my id`, other AS `my value` FROM _dynamodb.foo ORDER BY id;
