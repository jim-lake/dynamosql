-- CREATE TABLE with single column
DROP TABLE IF EXISTS _dynamodb.single_col;
CREATE TABLE _dynamodb.single_col (id INT PRIMARY KEY);
INSERT INTO _dynamodb.single_col (id) VALUES (1), (2), (3);
SELECT * FROM _dynamodb.single_col ORDER BY id;
DROP TABLE _dynamodb.single_col;

-- CREATE TABLE with multiple columns
DROP TABLE IF EXISTS _dynamodb.multi_col;
CREATE TABLE _dynamodb.multi_col (
  id INT PRIMARY KEY,
  name VARCHAR(256),
  age INT,
  email VARCHAR(256)
);
INSERT INTO _dynamodb.multi_col (id, name, age, email) VALUES (1, "Alice", 30, "alice@example.com");
SELECT * FROM _dynamodb.multi_col ORDER BY id;
DROP TABLE _dynamodb.multi_col;

-- CREATE TABLE with composite primary key
DROP TABLE IF EXISTS _dynamodb.composite_pk;
CREATE TABLE _dynamodb.composite_pk (
  key1 INT,
  key2 INT,
  value VARCHAR(256),
  PRIMARY KEY (key1, key2)
);
INSERT INTO _dynamodb.composite_pk (key1, key2, value) VALUES (1, 1, "one-one"), (1, 2, "one-two");
SELECT * FROM _dynamodb.composite_pk ORDER BY key1, key2;
DROP TABLE _dynamodb.composite_pk;

-- CREATE TABLE IF NOT EXISTS (table doesn't exist)
DROP TABLE IF EXISTS _dynamodb.if_not_exists;
CREATE TABLE IF NOT EXISTS _dynamodb.if_not_exists (id INT PRIMARY KEY);
INSERT INTO _dynamodb.if_not_exists (id) VALUES (1);
SELECT * FROM _dynamodb.if_not_exists ORDER BY id;

-- CREATE TABLE IF NOT EXISTS (table exists)
CREATE TABLE IF NOT EXISTS _dynamodb.if_not_exists (id INT PRIMARY KEY);
SELECT * FROM _dynamodb.if_not_exists ORDER BY id;
DROP TABLE _dynamodb.if_not_exists;

-- CREATE TEMPORARY TABLE with MEMORY engine
CREATE TEMPORARY TABLE temp_memory (id INT PRIMARY KEY, name VARCHAR(256)) ENGINE=MEMORY;
INSERT INTO temp_memory (id, name) VALUES (1, "temp1"), (2, "temp2");
SELECT * FROM temp_memory ORDER BY id;

-- CREATE TEMPORARY TABLE with RAW engine
CREATE TEMPORARY TABLE temp_raw (id INT PRIMARY KEY, name VARCHAR(256)) ENGINE=RAW;
INSERT INTO temp_raw (id, name) VALUES (10, "raw1"), (20, "raw2");
SELECT * FROM temp_raw ORDER BY id;

-- CREATE TABLE AS SELECT (CTAS) with WHERE
DROP TABLE IF EXISTS _dynamodb.ctas_where;
CREATE TABLE _dynamodb.ctas_where (id VARCHAR(256) PRIMARY KEY, other INT)
  AS SELECT id, other FROM _dynamodb.foo WHERE other > 100;
SELECT * FROM _dynamodb.ctas_where ORDER BY id;
DROP TABLE _dynamodb.ctas_where;

-- CREATE TABLE AS SELECT with expressions
DROP TABLE IF EXISTS _dynamodb.ctas_expr;
CREATE TABLE _dynamodb.ctas_expr (id VARCHAR(256) PRIMARY KEY, doubled INT)
  AS SELECT id, other * 2 AS doubled FROM _dynamodb.foo WHERE other IS NOT NULL;
SELECT * FROM _dynamodb.ctas_expr ORDER BY id;
DROP TABLE _dynamodb.ctas_expr;

-- CREATE TABLE AS SELECT with JOIN
DROP TABLE IF EXISTS _dynamodb.ctas_join;
CREATE TABLE _dynamodb.ctas_join (id VARCHAR(256) PRIMARY KEY, foo_other INT, bar_other INT)
  AS SELECT foo.id, foo.other AS foo_other, bar.other AS bar_other
     FROM _dynamodb.foo JOIN _dynamodb.bar ON foo.id = bar.id;
SELECT * FROM _dynamodb.ctas_join ORDER BY id;
DROP TABLE _dynamodb.ctas_join;
