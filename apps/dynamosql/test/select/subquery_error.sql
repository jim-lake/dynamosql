SELECT id FROM _dynamodb.foo WHERE other = (SELECT other FROM _dynamodb.foo);
SELECT id FROM _dynamodb.foo WHERE other = (SELECT id, other FROM _dynamodb.foo WHERE id = '111');
CREATE DATABASE IF NOT EXISTS sub_mem;
CREATE TEMPORARY TABLE sub_mem.t (id INT PRIMARY KEY, c INT);
CREATE TEMPORARY TABLE sub_mem.u (id INT PRIMARY KEY, c INT);
INSERT INTO sub_mem.t (id, c) VALUES (1, 5), (2, 7), (3, 7), (4, NULL);
INSERT INTO sub_mem.u (id, c) VALUES (1, 5), (2, 7), (3, 7), (4, NULL);
SELECT id FROM sub_mem.t WHERE c = (SELECT c FROM sub_mem.u);
