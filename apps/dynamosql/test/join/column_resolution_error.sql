CREATE DATABASE IF NOT EXISTS mem_join;
CREATE TEMPORARY TABLE mem_join.t (id INT PRIMARY KEY, base INT);
CREATE TEMPORARY TABLE mem_join.u (id INT PRIMARY KEY, extra VARCHAR(20));
SELECT id FROM mem_join.t JOIN mem_join.u ON u.id = t.id;
SELECT id, extra FROM mem_join.t JOIN mem_join.u ON u.id = t.id;
SELECT t.id FROM mem_join.t JOIN mem_join.u ON u.id = t.id WHERE id = 1;
SELECT t.id FROM mem_join.t JOIN mem_join.u ON u.id = t.id WHERE nope = 1;
