CREATE DATABASE IF NOT EXISTS der_mem;
CREATE TEMPORARY TABLE der_mem.t (id INT PRIMARY KEY, c INT, name VARCHAR(20));
CREATE TEMPORARY TABLE der_mem.u (id INT PRIMARY KEY, c INT, nc INT);
INSERT INTO der_mem.t (id, c, name) VALUES (1, 5, 'Alpha'), (2, 7, 'beta'), (3, 7, 'gamma'), (4, NULL, 'delta');
INSERT INTO der_mem.u (id, c, nc) VALUES (1, 50, 500), (3, 70, 700);
UPDATE der_mem.t t JOIN (SELECT id, nc FROM der_mem.u) s ON s.id = t.id SET t.c = s.nc;
UPDATE der_mem.t t JOIN (SELECT id FROM der_mem.u WHERE nc > 600) s ON s.id = t.id SET t.name = 'matched';
SELECT s.id FROM (SELECT id FROM der_mem.t) ORDER BY 1;
SELECT s.id FROM (SELECT id, id FROM der_mem.t) s;
