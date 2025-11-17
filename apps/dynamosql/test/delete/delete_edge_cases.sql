-- Setup test data
INSERT IGNORE INTO _dynamodb.foo (id, other, comment) VALUES
  ("del1", 100, "delete test 1"),
  ("del2", 200, "delete test 2"),
  ("del3", 300, "delete test 3"),
  ("del4", NULL, "delete test 4"),
  ("del5", 500, NULL);

SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "del%" ORDER BY id;

-- Test DELETE with simple WHERE clause
DELETE FROM _dynamodb.foo WHERE id = "del1";
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "del%" ORDER BY id;

-- Test DELETE with NULL comparison
DELETE FROM _dynamodb.foo WHERE id = "del4";
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "del%" ORDER BY id;

-- Test DELETE with OR condition
DELETE FROM _dynamodb.foo WHERE id = "del2" OR id = "del3";
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "del%" ORDER BY id;

-- Cleanup remaining test data
DELETE FROM _dynamodb.foo WHERE id LIKE "del%";
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "del%" ORDER BY id;
