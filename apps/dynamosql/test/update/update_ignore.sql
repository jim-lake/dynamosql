CREATE DATABASE IF NOT EXISTS mem_update_ignore;
USE mem_update_ignore;

CREATE TEMPORARY TABLE a (id INT PRIMARY KEY, v INT);
INSERT INTO a (id, v) VALUES (1, 10), (2, 20), (3, 30);

UPDATE IGNORE a SET id = 2 WHERE id = 1;
SELECT id, v FROM a ORDER BY id;

UPDATE IGNORE a SET id = 4 WHERE id = 3;
SELECT id, v FROM a ORDER BY id;

UPDATE IGNORE a SET v = v + 1 WHERE id IN (1, 2);
SELECT id, v FROM a ORDER BY id;

UPDATE IGNORE a SET id = 9 WHERE id IN (1, 4);
SELECT id, v FROM a ORDER BY id;

UPDATE IGNORE a SET v = 0 WHERE id = 100;
SELECT id, v FROM a ORDER BY id;

INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("upd_ign_1", 1, "a"), ("upd_ign_2", 2, "b");
UPDATE IGNORE _dynamodb.foo SET other = other + 10 WHERE id = "upd_ign_1";
UPDATE IGNORE _dynamodb.foo SET comment = "changed" WHERE id IN ("upd_ign_1", "upd_ign_2");
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "upd_ign_%" ORDER BY id;
DELETE FROM _dynamodb.foo WHERE id LIKE "upd_ign_%";
