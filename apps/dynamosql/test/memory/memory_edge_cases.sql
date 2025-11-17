-- Test CREATE TEMPORARY TABLE with various column types
CREATE DATABASE IF NOT EXISTS mem_edge_test;
USE mem_edge_test;

CREATE TEMPORARY TABLE type_test (
  id INT PRIMARY KEY,
  str_col VARCHAR(256),
  int_col INT,
  bool_col BOOLEAN
);

-- Insert various data types
INSERT INTO type_test (id, str_col, int_col, bool_col) VALUES (1, "test", 100, TRUE);
INSERT INTO type_test (id, str_col, int_col, bool_col) VALUES (2, NULL, NULL, FALSE);
INSERT INTO type_test (id, str_col, int_col, bool_col) VALUES (3, "", 0, NULL);
SELECT * FROM type_test ORDER BY id;

-- Test UPDATE with NULL
UPDATE type_test SET str_col = NULL WHERE id = 1;
SELECT * FROM type_test ORDER BY id;

-- Test UPDATE with expressions
UPDATE type_test SET int_col = int_col + 10 WHERE id = 1;
SELECT * FROM type_test ORDER BY id;

-- Test DELETE with complex WHERE
DELETE FROM type_test WHERE str_col IS NULL AND int_col IS NOT NULL;
SELECT * FROM type_test ORDER BY id;

-- Test REPLACE on memory table
REPLACE INTO type_test (id, str_col, int_col, bool_col) VALUES (2, "replaced", 200, TRUE);
SELECT * FROM type_test ORDER BY id;

-- Test INSERT IGNORE on duplicate
INSERT IGNORE INTO type_test (id, str_col) VALUES (2, "ignored");
SELECT * FROM type_test ORDER BY id;

-- Test GROUP BY on memory table
INSERT INTO type_test (id, str_col, int_col) VALUES (4, "group1", 100);
INSERT INTO type_test (id, str_col, int_col) VALUES (5, "group1", 200);
INSERT INTO type_test (id, str_col, int_col) VALUES (6, "group2", 300);
SELECT str_col, SUM(int_col) AS total FROM type_test GROUP BY str_col ORDER BY str_col;

-- Test ORDER BY with NULL values
SELECT * FROM type_test ORDER BY bool_col, id;

-- Test LIMIT and OFFSET
SELECT * FROM type_test ORDER BY id LIMIT 2;
SELECT * FROM type_test ORDER BY id LIMIT 2 OFFSET 2;

-- Cleanup
USE _dynamodb;
DROP DATABASE mem_edge_test;
