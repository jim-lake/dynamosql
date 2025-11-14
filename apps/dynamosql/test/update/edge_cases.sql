-- Setup test data
INSERT IGNORE INTO _dynamodb.foo (id, other, comment) VALUES
  ("edge1", 100, "edge test 1"),
  ("edge2", 200, "edge test 2"),
  ("edge3", 300, "edge test 3");
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "edge%" ORDER BY id;

-- UPDATE to NULL
UPDATE _dynamodb.foo SET other = NULL WHERE id = "edge1";
UPDATE _dynamodb.foo SET comment = NULL WHERE id = "edge2";
UPDATE _dynamodb.foo SET other = NULL, comment = NULL WHERE id = "edge3";
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "edge%" ORDER BY id;

-- UPDATE from NULL
UPDATE _dynamodb.foo SET other = 150 WHERE id = "edge1";
UPDATE _dynamodb.foo SET comment = "restored" WHERE id = "edge2";
UPDATE _dynamodb.foo SET other = 350, comment = "restored 3" WHERE id = "edge3";
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "edge%" ORDER BY id;

-- UPDATE with expressions
UPDATE _dynamodb.foo SET other = other + 10 WHERE id = "edge1";
UPDATE _dynamodb.foo SET other = other * 2 WHERE id = "edge2";
UPDATE _dynamodb.foo SET other = other - 50 WHERE id = "edge3";
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "edge%" ORDER BY id;

-- UPDATE with string functions
UPDATE _dynamodb.foo SET comment = CONCAT(comment, " updated") WHERE id = "edge1";
UPDATE _dynamodb.foo SET comment = LOWER(comment) WHERE id = "edge2";
UPDATE _dynamodb.foo SET comment = LEFT(comment, 10) WHERE id = "edge3";
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "edge%" ORDER BY id;

-- UPDATE with COALESCE
UPDATE _dynamodb.foo SET other = COALESCE(other, 999) WHERE id = "edge1";
UPDATE _dynamodb.foo SET comment = COALESCE(comment, "default") WHERE id = "edge2";
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "edge%" ORDER BY id;

-- UPDATE with CAST
UPDATE _dynamodb.foo SET comment = CAST(other AS CHAR) WHERE id = "edge1";
SELECT id, other, comment FROM _dynamodb.foo WHERE id = "edge1";

-- UPDATE multiple columns with expressions
UPDATE _dynamodb.foo SET other = other + 100, comment = CONCAT("multi: ", comment) WHERE id = "edge2";
SELECT id, other, comment FROM _dynamodb.foo WHERE id = "edge2";

-- UPDATE with no matching rows
UPDATE _dynamodb.foo SET other = 999 WHERE id = "nonexistent";
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "edge%" ORDER BY id;

-- UPDATE all rows (with WHERE to limit scope)
UPDATE _dynamodb.foo SET other = 500 WHERE id LIKE "edge%";
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "edge%" ORDER BY id;

-- UPDATE with complex WHERE
UPDATE _dynamodb.foo SET comment = "complex where" WHERE id LIKE "edge%" AND other = 500;
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "edge%" ORDER BY id;

-- Cleanup
DELETE FROM _dynamodb.foo WHERE id LIKE "edge%";
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
