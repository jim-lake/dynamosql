-- INSERT with NULL values
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("null1", NULL, "has null other");
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("null2", 100, NULL);
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("null3", NULL, NULL);
SELECT id, other, comment FROM _dynamodb.foo WHERE id IN ("null1", "null2", "null3") ORDER BY id;

-- INSERT with expressions
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("expr1", 10 + 20, CONCAT("sum", " test"));
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("expr2", 5 * 10, LOWER("UPPERCASE"));
SELECT id, other, comment FROM _dynamodb.foo WHERE id IN ("expr1", "expr2") ORDER BY id;

-- INSERT with CAST
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("cast1", CAST("123" AS SIGNED), CAST(456 AS CHAR));
SELECT id, other, comment FROM _dynamodb.foo WHERE id = "cast1";

-- INSERT with functions
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("func1", LENGTH("hello"), CONCAT("test", "123"));
SELECT id, other, comment FROM _dynamodb.foo WHERE id = "func1";

-- INSERT with COALESCE
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("coal1", COALESCE(NULL, 999), COALESCE(NULL, "default"));
SELECT id, other, comment FROM _dynamodb.foo WHERE id = "coal1";

-- INSERT partial columns
INSERT INTO _dynamodb.foo (id) VALUES ("partial1");
INSERT INTO _dynamodb.foo (id, other) VALUES ("partial2", 200);
INSERT INTO _dynamodb.foo (id, comment) VALUES ("partial3", "only comment");
SELECT id, other, comment FROM _dynamodb.foo WHERE id IN ("partial1", "partial2", "partial3") ORDER BY id;

-- INSERT with column order different from table
INSERT INTO _dynamodb.foo (comment, id, other) VALUES ("reordered", "reorder1", 300);
INSERT INTO _dynamodb.foo (other, comment, id) VALUES (400, "reordered2", "reorder2");
SELECT id, other, comment FROM _dynamodb.foo WHERE id IN ("reorder1", "reorder2") ORDER BY id;

-- INSERT multiple rows with mixed NULL
INSERT INTO _dynamodb.foo (id, other, comment) VALUES
  ("multi1", 100, "first"),
  ("multi2", NULL, "second"),
  ("multi3", 300, NULL),
  ("multi4", NULL, NULL);
SELECT id, other, comment FROM _dynamodb.foo WHERE id IN ("multi1", "multi2", "multi3", "multi4") ORDER BY id;

-- Cleanup
DELETE FROM _dynamodb.foo WHERE id IN (
  "null1", "null2", "null3",
  "expr1", "expr2",
  "cast1", "func1", "coal1",
  "partial1", "partial2", "partial3",
  "reorder1", "reorder2",
  "multi1", "multi2", "multi3", "multi4"
);
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;

-- INSERT SELECT with mismatched column count (should error)
INSERT INTO _dynamodb.foo (id, other, comment) SELECT "test", 123;
