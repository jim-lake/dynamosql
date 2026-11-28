DROP TABLE IF EXISTS _dynamodb.raw_ins_edge;
CREATE TABLE _dynamodb.raw_ins_edge (id VARCHAR(768) PRIMARY KEY, other JSON, comment JSON);

-- INSERT with expressions
INSERT INTO _dynamodb.raw_ins_edge (id, other, comment) VALUES ("expr1", 10 + 20, CONCAT("sum", " test"));
INSERT INTO _dynamodb.raw_ins_edge (id, other, comment) VALUES ("expr2", 5 * 10, LOWER("UPPERCASE"));
SELECT other = 30 AS assert_other, comment = 'sum test' AS assert_comment FROM _dynamodb.raw_ins_edge WHERE id = "expr1";
SELECT other = 50 AS assert_other, comment = 'uppercase' AS assert_comment FROM _dynamodb.raw_ins_edge WHERE id = "expr2";

-- INSERT with CAST
INSERT INTO _dynamodb.raw_ins_edge (id, other, comment) VALUES ("cast1", CAST("123" AS SIGNED), CAST(456 AS CHAR));

-- INSERT with functions
INSERT INTO _dynamodb.raw_ins_edge (id, other, comment) VALUES ("func1", LENGTH("hello"), CONCAT("test", "123"));
SELECT other = 5 AS assert_other, comment = 'test123' AS assert_comment FROM _dynamodb.raw_ins_edge WHERE id = "func1";

-- INSERT with COALESCE
INSERT INTO _dynamodb.raw_ins_edge (id, other, comment) VALUES ("coal1", COALESCE(NULL, 999), COALESCE(NULL, "default"));
SELECT other = 999 AS assert_other, comment = 'default' AS assert_comment FROM _dynamodb.raw_ins_edge WHERE id = "coal1";

DROP TABLE _dynamodb.raw_ins_edge;
