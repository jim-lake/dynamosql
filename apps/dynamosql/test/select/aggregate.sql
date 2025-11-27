-- Setup test data
INSERT INTO _dynamodb.foo SET id = "agg1", other = 100, comment = "test";
INSERT INTO _dynamodb.foo SET id = "agg2", other = 200, comment = "test";
INSERT INTO _dynamodb.foo SET id = "agg3", other = 300, comment = "test";
INSERT INTO _dynamodb.foo SET id = "agg4", other = 150, comment = "other";

-- Test AVG
SELECT AVG(other) AS result FROM _dynamodb.foo WHERE id LIKE "agg%";
SELECT comment, AVG(other) AS result FROM _dynamodb.foo WHERE id LIKE "agg%" GROUP BY comment ORDER BY comment;

-- Test MIN
SELECT MIN(other) AS result FROM _dynamodb.foo WHERE id LIKE "agg%";
SELECT comment, MIN(other) AS result FROM _dynamodb.foo WHERE id LIKE "agg%" GROUP BY comment ORDER BY comment;

-- Test MAX
SELECT MAX(other) AS result FROM _dynamodb.foo WHERE id LIKE "agg%";
SELECT comment, MAX(other) AS result FROM _dynamodb.foo WHERE id LIKE "agg%" GROUP BY comment ORDER BY comment;

-- Cleanup
DELETE FROM _dynamodb.foo WHERE id = "agg1";
DELETE FROM _dynamodb.foo WHERE id = "agg2";
DELETE FROM _dynamodb.foo WHERE id = "agg3";
DELETE FROM _dynamodb.foo WHERE id = "agg4";
