CREATE DATABASE IF NOT EXISTS mem_test;
CREATE TEMPORARY TABLE mem_test.bar (id INT PRIMARY KEY, comment VARCHAR(256));
LIST TABLES;

INSERT INTO mem_test.bar SET id = 4, comment = "foobar";
SELECT id, comment FROM mem_test.bar ORDER BY id;
INSERT INTO mem_test.bar SET id = 3, comment = "3 foobar";
SELECT id, comment FROM mem_test.bar ORDER BY id;
UPDATE FROM mem_test.bar SET comment = "barbar" WHERE id = 4;
SELECT id, comment FROM mem_test.bar ORDER BY id;
DELETE FROM mem_test.bar WHERE id = 3;
SELECT id, comment FROM mem_test.bar ORDER BY id;

USE mem_test;
CREATE TEMPORARY TABLE foo (id INT PRIMARY KEY, comment VARCHAR(256));
LIST TABLES;
INSERT INTO foo (id, comment) VALUES (1, "1 comment"), (2, "2 comment");
SELECT id, comment FROM foo ORDER BY id;
SELECT id, comment FROM mem_test.foo ORDER BY id;
SELECT id, comment FROM mem_test.bar ORDER BY id;

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

DELETE FROM foo WHERE id = 1;
SELECT id, comment FROM foo ORDER BY id;
INSERT INTO foo (id, comment) VALUES (1, "1 comment");
SELECT id, comment FROM foo ORDER BY id;

DELETE FROM foo WHERE id = 999;
SELECT id, comment FROM foo ORDER BY id;
DELETE FROM foo WHERE comment = "missing";
SELECT id, comment FROM foo ORDER BY id;

DELETE FROM foo WHERE comment = "2 comment";
SELECT id, comment FROM foo ORDER BY id;
INSERT INTO foo (id, comment) VALUES (2, "2 comment");

INSERT INTO foo (id, comment) VALUES (4, "1 comment"), (5, "1 comment");
SELECT id, comment FROM foo ORDER BY id;
DELETE FROM foo WHERE comment = "1 comment";
SELECT id, comment FROM foo ORDER BY id;
INSERT INTO foo (id, comment) VALUES (1, "1 comment");
SELECT id, comment FROM foo ORDER BY id;

