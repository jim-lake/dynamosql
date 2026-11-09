-- Setup test data
INSERT INTO _dynamodb.foo SET id = "winerr1", other = 100, comment = "test";
INSERT INTO _dynamodb.foo SET id = "winerr2", other = 200, comment = "test";

SELECT id, COUNT(DISTINCT comment) OVER () AS n FROM _dynamodb.foo WHERE id LIKE "winerr%";

-- Cleanup
DELETE FROM _dynamodb.foo WHERE id = "winerr1";
DELETE FROM _dynamodb.foo WHERE id = "winerr2";
