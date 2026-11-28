-- Setup test data
INSERT IGNORE INTO _dynamodb.foo (id, other, comment) VALUES
  ("upd_edge1", '100', '"edge test 1"'),
  ("upd_edge2", '200', '"edge test 2"'),
  ("upd_edge3", '300', '"edge test 3"');
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "upd_edge%" ORDER BY id;

-- UPDATE to NULL
UPDATE _dynamodb.foo SET other = NULL WHERE id = "upd_edge1";
UPDATE _dynamodb.foo SET comment = NULL WHERE id = "upd_edge2";
UPDATE _dynamodb.foo SET other = NULL, comment = NULL WHERE id = "upd_edge3";
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "upd_edge%" ORDER BY id;

-- UPDATE from NULL
UPDATE _dynamodb.foo SET other = '150' WHERE id = "upd_edge1";
UPDATE _dynamodb.foo SET comment = '"restored"' WHERE id = "upd_edge2";
UPDATE _dynamodb.foo SET other = '350', comment = '"restored 3"' WHERE id = "upd_edge3";
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "upd_edge%" ORDER BY id;

-- UPDATE with COALESCE on a NULL column
UPDATE _dynamodb.foo SET comment = '"default"' WHERE id = "upd_edge3" AND comment IS NULL;
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "upd_edge%" ORDER BY id;

-- UPDATE with no matching rows
UPDATE _dynamodb.foo SET other = '999' WHERE id = "nonexistent";
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "upd_edge%" ORDER BY id;

-- UPDATE all rows (with WHERE to limit scope)
UPDATE _dynamodb.foo SET other = '500' WHERE id LIKE "upd_edge%";
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "upd_edge%" ORDER BY id;

-- UPDATE with complex WHERE
UPDATE _dynamodb.foo SET comment = '"complex where"' WHERE id LIKE "upd_edge%" AND other = 500;
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "upd_edge%" ORDER BY id;

-- Cleanup
DELETE FROM _dynamodb.foo WHERE id LIKE "upd_edge%";
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
