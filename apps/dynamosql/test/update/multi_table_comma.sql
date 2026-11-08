CREATE DATABASE IF NOT EXISTS mem_gap_update_comma;
USE mem_gap_update_comma;
CREATE TEMPORARY TABLE t (id INT PRIMARY KEY, col INT);
CREATE TEMPORARY TABLE u (id INT PRIMARY KEY, col INT);
INSERT INTO t (id, col) VALUES (1, 0), (2, 0), (3, 0);
INSERT INTO u (id, col) VALUES (1, 100), (2, 200);

UPDATE t, u SET t.col = u.col WHERE t.id = u.id;
SELECT id, col FROM t ORDER BY id;

UPDATE t, u SET t.col = t.col + 1, u.col = 0 WHERE t.id = u.id AND t.id = 2;
SELECT id, col FROM t ORDER BY id;
SELECT id, col FROM u ORDER BY id;
