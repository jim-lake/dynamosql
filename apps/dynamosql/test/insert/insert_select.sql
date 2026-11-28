-- Cleanup first
DELETE FROM _dynamodb.foo WHERE id IN ("comment", "333", "123", "123456", "999", "667", "777");

SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;

INSERT INTO _dynamodb.foo (id, other, comment) SELECT "333", '333', '"comment 333"';
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
INSERT INTO _dynamodb.foo (id, other, comment) SELECT "123", '999', '"inserted 123"';
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
INSERT INTO _dynamodb.foo (id, other, comment) SELECT "999", '999', '"inserted 999"';
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
INSERT IGNORE INTO _dynamodb.foo (id, other, comment) SELECT "999", '999', '"inserted 999"';
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
INSERT IGNORE INTO _dynamodb.foo (id, other, comment) SELECT "111", '999', '"inserted 3333"';
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;

-- Removed added rows
DELETE FROM _dynamodb.foo WHERE id = "333";
DELETE FROM _dynamodb.foo WHERE id = "123";
DELETE FROM _dynamodb.foo WHERE id = "123456";
DELETE FROM _dynamodb.foo WHERE id = "999";
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
