-- always have a unique int column on the end of the order by to make sure a
-- definitive order is established. arbitrary ordering will not be consistent
-- or persistent

SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
INSERT INTO _dynamodb.foo SET id = "123", other = 999, comment = "inserted 123";
INSERT INTO _dynamodb.foo SET id = "333", other = 999, comment = "Assigned";
INSERT INTO _dynamodb.foo SET id = "667", other = 999, comment = "aa";
INSERT INTO _dynamodb.foo SET id = "777", other = 999, comment = "about";
INSERT INTO _dynamodb.foo SET id = "999", other = 999, comment = "zed";
INSERT INTO _dynamodb.foo SET id = "667", other = 999, comment = "Zad";

SELECT id, other, comment FROM _dynamodb.foo ORDER BY LOWER(comment), id;
SELECT id, other, comment FROM _dynamodb.foo ORDER BY LOWER(comment) ASC, id;
SELECT id, other, comment FROM _dynamodb.foo ORDER BY LOWER(comment) DESC, id;

SELECT id, comment FROM _dynamodb.foo ORDER BY CAST(id AS CHAR), id;
SELECT id, comment FROM _dynamodb.foo ORDER BY CONCAT(comment, 'suffix'), id;
SELECT id, comment FROM _dynamodb.foo ORDER BY "foo", id;
SELECT id, comment FROM _dynamodb.foo ORDER BY comment COLLATE UTF8MB4_BIN, id;
SELECT id, comment FROM _dynamodb.foo ORDER BY comment COLLATE UTF8MB4_0900_AS_CS, id;
SELECT id, comment FROM _dynamodb.foo ORDER BY comment COLLATE UTF8MB4_0900_AI_CI, id;
SELECT id, comment FROM _dynamodb.foo ORDER BY comment COLLATE UTF8MB4_GENERAL_CI, id;

SELECT id, comment FROM _dynamodb.foo ORDER BY 2,1;
SELECT id, comment COLLATE UTF8MB4_BIN AS comment FROM _dynamodb.foo ORDER BY 2,1;
SELECT id, comment COLLATE UTF8MB4_0900_AS_CS AS comment FROM _dynamodb.foo ORDER BY 2,1;
SELECT id, comment COLLATE UTF8MB4_0900_AI_CI AS comment FROM _dynamodb.foo ORDER BY 2,1;
SELECT id, comment COLLATE UTF8MB4_GENERAL_CI AS comment FROM _dynamodb.foo ORDER BY 2,1;

DELETE FROM _dynamodb.foo WHERE id = "123";
DELETE FROM _dynamodb.foo WHERE id = "333";
DELETE FROM _dynamodb.foo WHERE id = "667";
DELETE FROM _dynamodb.foo WHERE id = "777";
DELETE FROM _dynamodb.foo WHERE id = "999";
DELETE FROM _dynamodb.foo WHERE id = "667";
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;

CREATE TEMPORARY TABLE _dynamodb.temp_foo (id INT PRIMARY KEY, s1 VARCHAR(32) COLLATE UTF8MB4_0900_AI_CI, s2 VARCHAR(32) COLLATE UTF8MB4_0900_AS_CS);
INSERT INTO _dynamodb.temp_foo (id, s1, s2) VALUES (1, "a", "a"), (2, "B", "à"), (3, "b", "b");
SELECT id, s1, s2 FROM _dynamodb.temp_foo ORDER BY s1, id;
SELECT id, s1, s2 FROM _dynamodb.temp_foo ORDER BY s2, id;
SELECT id, s1, s2 FROM _dynamodb.temp_foo ORDER BY s1 DESC, id;
SELECT id, s1, s2 FROM _dynamodb.temp_foo ORDER BY s2 DESC, id;
SELECT id, s1, s2 FROM _dynamodb.temp_foo ORDER BY s1 COLLATE UTF8MB4_BIN, id;
SELECT id, s1, s2 FROM _dynamodb.temp_foo ORDER BY s2 COLLATE UTF8MB4_BIN, id;
SELECT id, s1, s2 FROM _dynamodb.temp_foo ORDER BY s1 COLLATE UTF8MB4_BIN DESC, id;
SELECT id, s1, s2 FROM _dynamodb.temp_foo ORDER BY s2 COLLATE UTF8MB4_BIN DESC, id;
DROP TABLE _dynamodb.temp_foo;
