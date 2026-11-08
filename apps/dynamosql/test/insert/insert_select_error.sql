INSERT INTO _dynamodb.foo (id, other, comment) SELECT "123", 999, "inserted 123 again";
INSERT INTO _dynamodb.foo (id, other, comment) SELECT "123", 999, "inserted 123 again";
INSERT INTO _dynamodb.unknown (id) SELECT "111";
INSERT IGNORE INTO _dynamodb.unknown (id) SELECT "111";
INSERT INTO _dynamodb.foo (id) SELECT id FROM _dynamodb.bar;
INSERT INTO _dynamodb.foo (id, other, comment) SELECT "comment" AS comment, 11 AS other, CAST(other AS CHAR) AS id FROM _dynamodb.bar ORDER BY id;
DELETE FROM _dynamodb.foo WHERE id = "123";
