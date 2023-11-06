SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
INSERT INTO _dynamodb.foo SET id = "123", other = 999, comment = "inserted 123";
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
INSERT INTO _dynamodb.foo SET id = "123", other = 999, comment = "inserted 123";
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
INSERT INTO _dynamodb.foo SET id = "999", other = 999, comment = "inserted 999";
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
INSERT IGNORE INTO _dynamodb.foo SET id = "999", other = 999, comment = "inserted 999";
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
INSERT IGNORE INTO _dynamodb.foo SET id = "111", other = 999, comment = "inserted 3333";
INSERT INTO _dynamodb.unknown SET id = "111";
INSERT IGNORE INTO _dynamodb.unknown SET id = "111";
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("123456", 123456, "inserted 123456"), ("111", 111, "111");
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
INSERT IGNORE INTO _dynamodb.foo (id, other, comment) VALUES ("123456", 123456, "inserted 123456"), ("111", 111, "111");
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;

-- Removed added rows
DELETE FROM _dynamodb.foo WHERE id = "123456";
DELETE FROM _dynamodb.foo WHERE id = "123";
DELETE FROM _dynamodb.foo WHERE id = "999";

-- Verify sync
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
