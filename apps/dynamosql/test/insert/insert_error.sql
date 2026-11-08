INSERT INTO _dynamodb.foo SET id = "123", other = 999, comment = "inserted 123";
INSERT INTO _dynamodb.foo SET id = "123", other = 999, comment = "inserted 123";
INSERT INTO _dynamodb.unknown SET id = "111";
INSERT IGNORE INTO _dynamodb.unknown SET id = "111";
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("123456", 123456, "inserted 123456"), ("111", 111, "111");
DELETE FROM _dynamodb.foo WHERE id = "123";
