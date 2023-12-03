CREATE DATABASE IF NOT EXISTS mem_test;
USE mem_test;
CREATE TEMPORARY TABLE foo (id INT PRIMARY KEY, comment VARCHAR(256));
INSERT INTO foo (id, comment) VALUES (1, "1 comment"), (2, "2 comment");
SELECT id, comment FROM foo ORDER BY id;
INSERT INTO foo (id, comment) VALUES (1, "1 comment"), (2, "2 comment");
SELECT id, comment FROM foo ORDER BY id;
INSERT INTO foo SET id = 1, comment = "1 comment";
SELECT id, comment FROM foo ORDER BY id;
INSERT IGNORE INTO foo SET id = 1, comment = "1 comment";
SELECT id, comment FROM foo ORDER BY id;
REPLACE INTO foo SET id = 1, comment = "1 comment";
SELECT id, comment FROM foo ORDER BY id;
REPLACE INTO foo SET id = 1, comment = "new comment";
SELECT id, comment FROM foo ORDER BY id;
REPLACE INTO foo SET id = 3, comment = "3 comment";
SELECT id, comment FROM foo ORDER BY id;
UPDATE foo SET comment = "3 comment" WHERE id = 3;
SELECT id, comment FROM foo ORDER BY id;
UPDATE foo SET comment = "3 comment again" WHERE id = 3;
SELECT id, comment FROM foo ORDER BY id;
UPDATE foo SET id = 4 WHERE id = 3;
SELECT id, comment FROM foo ORDER BY id;
UPDATE foo SET id = 4;
SELECT id, comment FROM foo ORDER BY id;
