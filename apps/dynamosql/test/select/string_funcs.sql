-- check table before we run
SELECT id, CAST(other AS SIGNED) AS other, comment FROM _dynamodb.foo ORDER BY id;
-- with column refs
SELECT LEFT(comment, other) AS foo FROM _dynamodb.foo WHERE id = "4";
SELECT LEFT(comment, -other) AS foo FROM _dynamodb.foo WHERE id = "4";
SELECT LEFT(comment, other - 999) AS foo FROM _dynamodb.foo WHERE id = "4";
SELECT LEFT(comment, other - 105) AS foo FROM _dynamodb.foo WHERE id = "4";
SELECT LEFT(comment, 119 - other) AS foo FROM _dynamodb.foo WHERE id = "4";
SELECT LEFT(comment, other) AS foo FROM _dynamodb.foo WHERE id = "99";
SELECT LEFT(comment, -other) AS foo FROM _dynamodb.foo WHERE id = "99";
SELECT LEFT(comment, other - 999) AS foo FROM _dynamodb.foo WHERE id = "99";
SELECT LEFT(comment, other - 105) AS foo FROM _dynamodb.foo WHERE id = "99";
SELECT LEFT(comment, 119 - other) AS foo FROM _dynamodb.foo WHERE id = "99";
SELECT LEFT(comment, other) AS foo FROM _dynamodb.foo WHERE id = "111";
SELECT LEFT(comment, -other) AS foo FROM _dynamodb.foo WHERE id = "111";
SELECT LEFT(comment, other - 999) AS foo FROM _dynamodb.foo WHERE id = "111";
SELECT LEFT(comment, other - 105) AS foo FROM _dynamodb.foo WHERE id = "111";
SELECT LEFT(comment, 119 - other) AS foo FROM _dynamodb.foo WHERE id = "111";

SELECT LENGTH(comment) AS foo FROM _dynamodb.foo WHERE id = "4";
SELECT LENGTH(comment) AS foo FROM _dynamodb.foo WHERE id = "99";
SELECT LENGTH(comment) AS foo FROM _dynamodb.foo WHERE id = "111";
