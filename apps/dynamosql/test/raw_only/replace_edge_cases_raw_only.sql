DROP TABLE IF EXISTS _dynamodb.raw_rep_edge;
CREATE TABLE _dynamodb.raw_rep_edge (id VARCHAR(768) PRIMARY KEY, other JSON, comment JSON);

-- REPLACE with expressions
REPLACE INTO _dynamodb.raw_rep_edge (id, other, comment) VALUES ("rep4", 10 + 20, CONCAT("expr", " test"));
SELECT other = 30 AS assert_other, comment = 'expr test' AS assert_comment FROM _dynamodb.raw_rep_edge WHERE id = "rep4";
REPLACE INTO _dynamodb.raw_rep_edge (id, other, comment) VALUES ("rep4", 5 * 10, LOWER("REPLACED"));
SELECT other = 50 AS assert_other, comment = 'replaced' AS assert_comment FROM _dynamodb.raw_rep_edge WHERE id = "rep4";

-- REPLACE with CAST
REPLACE INTO _dynamodb.raw_rep_edge (id, other, comment) VALUES ("rep5", CAST("123" AS SIGNED), CAST(456 AS CHAR));

-- REPLACE with functions
REPLACE INTO _dynamodb.raw_rep_edge (id, other, comment) VALUES ("rep6", LENGTH("hello"), COALESCE(NULL, "default"));
SELECT other = 5 AS assert_other, comment = 'default' AS assert_comment FROM _dynamodb.raw_rep_edge WHERE id = "rep6";
REPLACE INTO _dynamodb.raw_rep_edge (id, other, comment) VALUES ("rep6", LENGTH("goodbye"), COALESCE("new", "default"));
SELECT other = 7 AS assert_other, comment = 'new' AS assert_comment FROM _dynamodb.raw_rep_edge WHERE id = "rep6";

DROP TABLE _dynamodb.raw_rep_edge;
