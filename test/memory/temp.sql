CREATE DATABASE IF NOT EXISTS mem_test;
USE mem_test;
CREATE TEMPORARY TABLE foo (id INT key, comment VARCHAR(256));
INSERT INTO foo (id, comment) VALUES (1, "1 comment"), (2, "2 comment");
SELECT id, comment FROM foo ORDER BY id;

