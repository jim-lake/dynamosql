SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
INSERT INTO _dynamodb.foo SET id = "123", other = 999, comment = "inserted 123";
INSERT INTO _dynamodb.foo SET id = "333", other = 999, comment = "Assigned";
INSERT INTO _dynamodb.foo SET id = "667", other = 999, comment = "about";
INSERT INTO _dynamodb.foo SET id = "777", other = 888, comment = "about";
INSERT INTO _dynamodb.foo SET id = "999", other = 888, comment = "zed";
INSERT INTO _dynamodb.foo SET id = "669", other = 888, comment = "ZED";
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;

SELECT other, SUM(id) FROM _dynamodb.foo GROUP BY 1 ORDER BY 1,2;
SELECT other, SUM(id) FROM _dynamodb.foo GROUP BY other ORDER BY 1,2;;
SELECT comment, SUM(other) FROM _dynamodb.foo GROUP BY 1 ORDER BY 1,2;
SELECT comment, SUM(other) FROM _dynamodb.foo GROUP BY comment ORDER BY 1,2;
SELECT LOWER(comment), SUM(other) FROM _dynamodb.foo GROUP BY LOWER(comment) ORDER BY 1,2;

INSERT INTO _dynamodb.foo SET id = "668", other = null, comment = "nullish";
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;

SELECT other, SUM(id) FROM _dynamodb.foo GROUP BY other ORDER BY 1,2;
SELECT comment, SUM(other) FROM _dynamodb.foo GROUP BY 1 ORDER BY 1,2;
SELECT other, SUM(id) FROM _dynamodb.foo WHERE id != "668" GROUP BY other ORDER BY 1,2;
SELECT comment, SUM(other) FROM _dynamodb.foo WHERE id != "668" GROUP BY 1 ORDER BY 1,2;

SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
DELETE FROM _dynamodb.foo WHERE id = "123";
DELETE FROM _dynamodb.foo WHERE id = "333";
DELETE FROM _dynamodb.foo WHERE id = "667";
DELETE FROM _dynamodb.foo WHERE id = "777";
DELETE FROM _dynamodb.foo WHERE id = "999";
DELETE FROM _dynamodb.foo WHERE id = "667";
DELETE FROM _dynamodb.foo WHERE id = "668";
DELETE FROM _dynamodb.foo WHERE id = "669";
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
