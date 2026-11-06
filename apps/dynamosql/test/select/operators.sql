-- Arithmetic with columns
SELECT id, other, other + 10 AS plus_ten FROM _dynamodb.foo WHERE other IS NOT NULL ORDER BY id;
SELECT id, other, other - 10 AS minus_ten FROM _dynamodb.foo WHERE other IS NOT NULL ORDER BY id;
SELECT id, other, other * 2 AS doubled FROM _dynamodb.foo WHERE other IS NOT NULL ORDER BY id;
SELECT id, other, other / 2 AS halved FROM _dynamodb.foo WHERE other IS NOT NULL ORDER BY id;

-- Comparison with columns
SELECT id, other FROM _dynamodb.foo WHERE other = 111 ORDER BY id;
SELECT id, other FROM _dynamodb.foo WHERE other != 111 ORDER BY id;
SELECT id, other FROM _dynamodb.foo WHERE other > 200 ORDER BY id;

-- NULL-safe equal with columns
SELECT id, other FROM _dynamodb.foo WHERE other <=> 111 ORDER BY id;
SELECT id, other FROM _dynamodb.foo WHERE other <=> NULL ORDER BY id;
SELECT id, other FROM _dynamodb.foo WHERE NOT (other <=> NULL) ORDER BY id;
SELECT id, other, other <=> NULL AS is_null_safe FROM _dynamodb.foo ORDER BY id;

-- NULL-safe equal pushdown for explicit NULL and missing attributes
INSERT IGNORE INTO _dynamodb.foo (id, other, comment) VALUES ("nsafe1", NULL, "explicit null");
INSERT IGNORE INTO _dynamodb.foo (id, comment) VALUES ("nsafe2", "missing other");
INSERT IGNORE INTO _dynamodb.foo (id, other, comment) VALUES ("nsafe3", 111, "has value");
SELECT id, other FROM _dynamodb.foo WHERE id LIKE "nsafe%" AND other <=> NULL ORDER BY id;
SELECT id, other FROM _dynamodb.foo WHERE id LIKE "nsafe%" AND other <=> 111 ORDER BY id;
SELECT id, other FROM _dynamodb.foo WHERE id LIKE "nsafe%" AND NOT (other <=> NULL) ORDER BY id;
UPDATE _dynamodb.foo SET comment = "updated" WHERE id = "nsafe1" AND other <=> NULL;
UPDATE _dynamodb.foo SET comment = "updated" WHERE id = "nsafe2" AND other <=> NULL;
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "nsafe%" ORDER BY id;
DELETE FROM _dynamodb.foo WHERE id = "nsafe1" AND other <=> NULL;
DELETE FROM _dynamodb.foo WHERE id = "nsafe2" AND other <=> NULL;
DELETE FROM _dynamodb.foo WHERE id = "nsafe3" AND other <=> 111;
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "nsafe%" ORDER BY id;

-- IS NULL and IS NOT NULL on a row where the attribute is missing
INSERT IGNORE INTO _dynamodb.foo (id, comment) VALUES ("nullmiss1", "missing other");
SELECT id, other FROM _dynamodb.foo WHERE id = "nullmiss1" AND other IS NULL ORDER BY id;
SELECT id, other FROM _dynamodb.foo WHERE id = "nullmiss1" AND other IS NOT NULL ORDER BY id;
DELETE FROM _dynamodb.foo WHERE id = "nullmiss1";
SELECT id, other FROM _dynamodb.foo WHERE other < 200 ORDER BY id;
SELECT id, other FROM _dynamodb.foo WHERE other >= 222 ORDER BY id;
SELECT id, other FROM _dynamodb.foo WHERE other <= 222 ORDER BY id;
