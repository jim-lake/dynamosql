
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
INSERT INTO _dynamodb.foo SET id = "123", other = 999, comment = "inserted 123";
INSERT INTO _dynamodb.foo SET id = "333", other = 999, comment = "Assigned";
INSERT INTO _dynamodb.foo SET id = "667", other = 999, comment = "aa";
INSERT INTO _dynamodb.foo SET id = "777", other = 999, comment = "about";
INSERT INTO _dynamodb.foo SET id = "999", other = 999, comment = "zed";
INSERT INTO _dynamodb.foo SET id = "667", other = 999, comment = "Zad";

SELECT id, other, comment FROM _dynamodb.foo ORDER BY LOWER(comment);
SELECT id, other, comment FROM _dynamodb.foo ORDER BY LOWER(comment) ASC;
SELECT id, other, comment FROM _dynamodb.foo ORDER BY LOWER(comment) DESC;

DELETE FROM _dynamodb.foo WHERE id = "123";
DELETE FROM _dynamodb.foo WHERE id = "333";
DELETE FROM _dynamodb.foo WHERE id = "667";
DELETE FROM _dynamodb.foo WHERE id = "777";
DELETE FROM _dynamodb.foo WHERE id = "999";
DELETE FROM _dynamodb.foo WHERE id = "667";
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
