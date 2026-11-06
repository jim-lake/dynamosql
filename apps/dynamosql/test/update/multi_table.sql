CREATE DATABASE IF NOT EXISTS mem_multi_update;
USE mem_multi_update;

CREATE TEMPORARY TABLE a (id INT PRIMARY KEY, v INT);
CREATE TEMPORARY TABLE b (id INT PRIMARY KEY, w INT);
INSERT INTO a (id, v) VALUES (1, 10), (2, 20), (3, 30);
INSERT INTO b (id, w) VALUES (2, 99);
SELECT id, v FROM a ORDER BY id;

UPDATE a JOIN b USING (id) SET a.v = 0;
SELECT id, v FROM a ORDER BY id;

UPDATE a JOIN b ON a.id = b.id SET a.v = 1;
SELECT id, v FROM a ORDER BY id;

UPDATE a JOIN b USING (id) SET a.v = b.w;
SELECT id, v FROM a ORDER BY id;

INSERT INTO b (id, w) VALUES (3, 88);
UPDATE a JOIN b USING (id) SET a.v = a.v + b.w;
SELECT id, v FROM a ORDER BY id;

SELECT a.id, a.v, b.w FROM a JOIN b USING (id) ORDER BY a.id;

CREATE TEMPORARY TABLE c (id INT PRIMARY KEY, k VARCHAR(16), v INT);
CREATE TEMPORARY TABLE d (id INT PRIMARY KEY, k VARCHAR(16), w INT);
INSERT INTO c (id, k, v) VALUES (1, 'x', 10), (2, 'y', 20), (3, 'z', 30);
INSERT INTO d (id, k, w) VALUES (1, 'x', 100), (2, 'q', 200), (3, 'z', 300);

UPDATE c JOIN d USING (id, k) SET c.v = 0;
SELECT id, k, v FROM c ORDER BY id;
