-- Setup
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;

-- REPLACE with VALUES syntax
REPLACE INTO _dynamodb.foo (id, other, comment) VALUES ("rep1", 100, "replace test 1");
SELECT id, other, comment FROM _dynamodb.foo WHERE id = "rep1";

-- REPLACE existing row
REPLACE INTO _dynamodb.foo (id, other, comment) VALUES ("rep1", 200, "replaced");
SELECT id, other, comment FROM _dynamodb.foo WHERE id = "rep1";

-- REPLACE with NULL values
REPLACE INTO _dynamodb.foo (id, other, comment) VALUES ("rep2", NULL, "null other");
SELECT id, other, comment FROM _dynamodb.foo WHERE id = "rep2";

REPLACE INTO _dynamodb.foo (id, other, comment) VALUES ("rep2", 300, NULL);
SELECT id, other, comment FROM _dynamodb.foo WHERE id = "rep2";

-- REPLACE with partial columns
REPLACE INTO _dynamodb.foo (id, other) VALUES ("rep3", 400);
SELECT id, other, comment FROM _dynamodb.foo WHERE id = "rep3";

REPLACE INTO _dynamodb.foo (id, comment) VALUES ("rep3", "only comment");
SELECT id, other, comment FROM _dynamodb.foo WHERE id = "rep3";

-- REPLACE with expressions
REPLACE INTO _dynamodb.foo (id, other, comment) VALUES ("rep4", 10 + 20, CONCAT("expr", " test"));
SELECT id, other, comment FROM _dynamodb.foo WHERE id = "rep4";

REPLACE INTO _dynamodb.foo (id, other, comment) VALUES ("rep4", 5 * 10, LOWER("REPLACED"));
SELECT id, other, comment FROM _dynamodb.foo WHERE id = "rep4";

-- REPLACE with CAST
REPLACE INTO _dynamodb.foo (id, other, comment) VALUES ("rep5", CAST("123" AS SIGNED), CAST(456 AS CHAR));
SELECT id, other, comment FROM _dynamodb.foo WHERE id = "rep5";

-- REPLACE with functions
REPLACE INTO _dynamodb.foo (id, other, comment) VALUES ("rep6", LENGTH("hello"), COALESCE(NULL, "default"));
SELECT id, other, comment FROM _dynamodb.foo WHERE id = "rep6";

REPLACE INTO _dynamodb.foo (id, other, comment) VALUES ("rep6", LENGTH("goodbye"), COALESCE("new", "default"));
SELECT id, other, comment FROM _dynamodb.foo WHERE id = "rep6";

-- REPLACE existing row from main table
REPLACE INTO _dynamodb.foo SET id = "4", other = 999, comment = "replaced 4";
SELECT id, other, comment FROM _dynamodb.foo WHERE id = "4";

-- Restore and cleanup
REPLACE INTO _dynamodb.foo SET id = "4", other = 4, comment = "4 comment";
DELETE FROM _dynamodb.foo WHERE id IN ("rep1", "rep2", "rep3", "rep4", "rep5", "rep6");
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
