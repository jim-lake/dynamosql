-- Scalar subqueries in WHERE (non-correlated, one row and one column)
SELECT id, other FROM _dynamodb.foo WHERE other = (SELECT other FROM _dynamodb.foo WHERE id = '111') ORDER BY id;
SELECT id FROM _dynamodb.foo WHERE other > (SELECT other FROM _dynamodb.foo WHERE id = '111') ORDER BY id;
SELECT id FROM _dynamodb.foo WHERE (SELECT other FROM _dynamodb.foo WHERE id = '113') = other ORDER BY id;
SELECT id FROM _dynamodb.bar WHERE other = (SELECT other FROM _dynamodb.bar WHERE id = '667') ORDER BY id;
SELECT id FROM _dynamodb.bar WHERE id = (SELECT id FROM _dynamodb.bar WHERE other = 'otherthing') ORDER BY id;
SELECT id FROM _dynamodb.foo WHERE other = (SELECT other FROM _dynamodb.foo WHERE id = '999') ORDER BY id;
SELECT id FROM _dynamodb.foo WHERE other = (SELECT other FROM _dynamodb.foo WHERE id = '99') ORDER BY id;
SELECT id FROM _dynamodb.foo WHERE other = (SELECT other FROM _dynamodb.foo WHERE id = '111') AND comment LIKE '%comment' ORDER BY id;
SELECT id FROM _dynamodb.foo WHERE other = (SELECT other FROM _dynamodb.foo WHERE id = '111') + 0 ORDER BY id;
SELECT id FROM _dynamodb.foo WHERE other = (SELECT other FROM _dynamodb.foo WHERE id = '111') OR id = '4' ORDER BY id;

-- Aggregate and expression subqueries on temporary tables
CREATE DATABASE IF NOT EXISTS sub_mem;
CREATE TEMPORARY TABLE sub_mem.t (id INT PRIMARY KEY, c INT);
CREATE TEMPORARY TABLE sub_mem.u (id INT PRIMARY KEY, c INT);
INSERT INTO sub_mem.t (id, c) VALUES (1, 5), (2, 7), (3, 7), (4, NULL);
INSERT INTO sub_mem.u (id, c) VALUES (1, 5), (2, 7), (3, 7), (4, NULL);
SELECT id FROM sub_mem.t WHERE c = (SELECT MAX(c) FROM sub_mem.u) ORDER BY id;
SELECT id FROM sub_mem.t WHERE c = (SELECT MAX(c) FROM sub_mem.u WHERE id < 0) ORDER BY id;
SELECT id FROM sub_mem.t WHERE c = (SELECT c FROM sub_mem.u WHERE id = 4) ORDER BY id;
SELECT id FROM sub_mem.t WHERE c > (SELECT AVG(c) FROM sub_mem.u) ORDER BY id;
SELECT id FROM sub_mem.t WHERE c = (SELECT c FROM sub_mem.u WHERE id = 1) + 2 ORDER BY id;
SELECT id FROM sub_mem.t WHERE (SELECT COUNT(*) FROM sub_mem.u) = 4 ORDER BY id;

-- Scalar subqueries in UPDATE and DELETE WHERE
CREATE TEMPORARY TABLE sub_mem.v (id INT PRIMARY KEY, c INT);
INSERT INTO sub_mem.v (id, c) VALUES (1, 5), (2, 7), (3, 7), (4, 9);
UPDATE sub_mem.v SET c = 0 WHERE c = (SELECT MAX(c) FROM sub_mem.u);
SELECT id, c FROM sub_mem.v ORDER BY id;
DELETE FROM sub_mem.v WHERE c = (SELECT MIN(c) FROM sub_mem.u);
SELECT id, c FROM sub_mem.v ORDER BY id;
