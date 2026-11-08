-- Memory engine: single primary key
CREATE DATABASE IF NOT EXISTS odku_mem_test;
USE odku_mem_test;
CREATE TEMPORARY TABLE odku_mem (id INT PRIMARY KEY, c INT, s VARCHAR(10));
INSERT INTO odku_mem (id, c, s) VALUES (1, 1, 'a') ON DUPLICATE KEY UPDATE c = c + 1;
SELECT * FROM odku_mem ORDER BY id;
INSERT INTO odku_mem (id, c, s) VALUES (1, 5, 'b') ON DUPLICATE KEY UPDATE c = c + 1;
SELECT * FROM odku_mem ORDER BY id;
INSERT INTO odku_mem (id, c, s) VALUES (1, 5, 'b') ON DUPLICATE KEY UPDATE c = c;
SELECT * FROM odku_mem ORDER BY id;
INSERT INTO odku_mem (id, c, s) VALUES (1, 5, 'b') ON DUPLICATE KEY UPDATE c = VALUES(c), s = VALUES(s);
SELECT * FROM odku_mem ORDER BY id;
INSERT INTO odku_mem (id, c, s) VALUES (1, 5, 'z') ON DUPLICATE KEY UPDATE c = VALUES(c), s = VALUES(s);
SELECT * FROM odku_mem ORDER BY id;
INSERT INTO odku_mem (id, c, s) VALUES (2, 7, 'x') ON DUPLICATE KEY UPDATE c = c * 100;
SELECT * FROM odku_mem ORDER BY id;
INSERT INTO odku_mem (id, c, s) VALUES (2, 7, 'x') ON DUPLICATE KEY UPDATE c = c * 100, s = CONCAT(s, VALUES(s));
SELECT * FROM odku_mem ORDER BY id;
INSERT INTO odku_mem (id, c, s) VALUES (2, 7, 'x') ON DUPLICATE KEY UPDATE c = c + VALUES(c) - c + 1;
SELECT * FROM odku_mem ORDER BY id;
INSERT INTO odku_mem (id, c, s) VALUES (3, 30, 'y'), (3, 31, 'w') ON DUPLICATE KEY UPDATE c = c + VALUES(c);
SELECT * FROM odku_mem ORDER BY id;
INSERT INTO odku_mem (id, c, s) VALUES (1, 1, 'one'), (4, 4, 'four'), (1, 2, 'two') ON DUPLICATE KEY UPDATE s = VALUES(s);
SELECT * FROM odku_mem ORDER BY id;
INSERT INTO odku_mem SET id = 1, c = 9, s = 'set' ON DUPLICATE KEY UPDATE c = VALUES(c) + c;
SELECT * FROM odku_mem ORDER BY id;
INSERT INTO odku_mem (id, c, s) VALUES (5, NULL, NULL) ON DUPLICATE KEY UPDATE c = 1;
INSERT INTO odku_mem (id, c, s) VALUES (5, 3, 'n') ON DUPLICATE KEY UPDATE c = VALUES(c), s = VALUES(s);
SELECT * FROM odku_mem ORDER BY id;
INSERT INTO odku_mem (id, c, s) VALUES (5, NULL, 'nul') ON DUPLICATE KEY UPDATE c = NULL;
SELECT * FROM odku_mem ORDER BY id;
INSERT INTO odku_mem (id, c, s) VALUES (5, 8, NULL) ON DUPLICATE KEY UPDATE s = VALUES(s), c = IFNULL(c, 0) + 1;
SELECT * FROM odku_mem ORDER BY id;
INSERT INTO odku_mem (id, c, s) VALUES (5, 8, 'q') ON DUPLICATE KEY UPDATE c = CASE WHEN c > 5 THEN c - 5 ELSE c END;
SELECT * FROM odku_mem ORDER BY id;
INSERT INTO odku_mem (id, c, s) SELECT 6, 60, 'six' ON DUPLICATE KEY UPDATE c = c + 1;
INSERT INTO odku_mem (id, c, s) SELECT 6, 60, 'six' ON DUPLICATE KEY UPDATE c = c + 1;
SELECT * FROM odku_mem ORDER BY id;
START TRANSACTION;
INSERT INTO odku_mem (id, c, s) VALUES (6, 1, 'rolled') ON DUPLICATE KEY UPDATE c = c + 1000;
ROLLBACK;
SELECT * FROM odku_mem ORDER BY id;
SELECT * FROM odku_mem ORDER BY id;

-- Memory engine: composite primary key and primary key changes
CREATE TEMPORARY TABLE odku_mem_pk (a INT, b INT, v VARCHAR(10), PRIMARY KEY (a, b));
INSERT INTO odku_mem_pk (a, b, v) VALUES (1, 1, 'x') ON DUPLICATE KEY UPDATE v = 'dup';
INSERT INTO odku_mem_pk (a, b, v) VALUES (1, 1, 'y') ON DUPLICATE KEY UPDATE v = CONCAT(v, VALUES(v));
INSERT INTO odku_mem_pk (a, b, v) VALUES (1, 2, 'z') ON DUPLICATE KEY UPDATE v = 'dup';
SELECT * FROM odku_mem_pk ORDER BY a, b;
INSERT INTO odku_mem_pk (a, b, v) VALUES (1, 1, 'k') ON DUPLICATE KEY UPDATE b = 3;
SELECT * FROM odku_mem_pk ORDER BY a, b;
INSERT INTO odku_mem_pk (a, b, v) VALUES (1, 1, 'k') ON DUPLICATE KEY UPDATE b = 2;
SELECT * FROM odku_mem_pk ORDER BY a, b;
INSERT INTO odku_mem_pk (a, b, v) VALUES (1, 3, 'k') ON DUPLICATE KEY UPDATE a = a + 10;
SELECT * FROM odku_mem_pk ORDER BY a, b;

-- Memory engine: primary key change to an existing key
CREATE TEMPORARY TABLE odku_mem_pkchg (id INT PRIMARY KEY, v INT);
INSERT INTO odku_mem_pkchg (id, v) VALUES (1, 10), (2, 20);
SELECT * FROM odku_mem_pkchg ORDER BY id;
INSERT INTO odku_mem_pkchg (id, v) VALUES (1, 1) ON DUPLICATE KEY UPDATE id = 7;
SELECT * FROM odku_mem_pkchg ORDER BY id;

