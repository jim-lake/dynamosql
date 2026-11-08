CREATE DATABASE IF NOT EXISTS mem_gap_insert;
USE mem_gap_insert;
CREATE TEMPORARY TABLE t (id INT PRIMARY KEY, c VARCHAR(16), n INT);

-- VALUES ROW(...) constructor
INSERT INTO t (id, c, n) VALUES ROW(1, 'a', 10), ROW(2, 'b', 20);
SELECT id, c, n FROM t ORDER BY id;
INSERT INTO t (id, c, n) VALUES ROW(3, 'c', NULL);
SELECT id, c, n FROM t ORDER BY id;

-- SELECT with only constants and no FROM clause
INSERT INTO t (id, c, n) SELECT 4, 'd', 40;
SELECT id, c, n FROM t ORDER BY id;
