-- ORDER BY and LIMIT inside a derived table, with the outer query ordering its result
CREATE DATABASE IF NOT EXISTS der_order;
DROP TABLE IF EXISTS der_order.t;
DROP TABLE IF EXISTS der_order.u;
CREATE TABLE der_order.t (id INT PRIMARY KEY, a INT NOT NULL) ENGINE=MEMORY;
INSERT INTO der_order.t (id, a) VALUES (1, 50), (2, 10), (3, 40), (4, 30), (5, 20);
CREATE TABLE der_order.u (id INT PRIMARY KEY, label VARCHAR(10)) ENGINE=MEMORY;
INSERT INTO der_order.u (id, label) VALUES (1, 'x'), (3, 'y'), (4, 'z'), (9, 'w');

SELECT * FROM (SELECT id, a FROM der_order.t ORDER BY a DESC LIMIT 2) s ORDER BY id;
SELECT s.id FROM (SELECT id, a FROM der_order.t ORDER BY a LIMIT 2 OFFSET 1) s ORDER BY s.id;
SELECT s.id FROM (SELECT id, a FROM der_order.t ORDER BY a LIMIT 3, 2) s ORDER BY s.id;
SELECT s.id FROM (SELECT id FROM der_order.t ORDER BY a LIMIT 10 OFFSET 4) s ORDER BY s.id;
SELECT s.id FROM (SELECT id FROM der_order.t ORDER BY a LIMIT 0) s ORDER BY s.id;
SELECT s.id, s.a FROM (SELECT id, a FROM der_order.t ORDER BY a DESC) s ORDER BY s.id;
SELECT COUNT(*) AS n, SUM(s.a) AS total FROM (SELECT id, a FROM der_order.t ORDER BY a DESC LIMIT 3) s;
SELECT s.id, u.label FROM (SELECT id, a FROM der_order.t ORDER BY a DESC LIMIT 3) s JOIN der_order.u u ON u.id = s.id ORDER BY s.id;
SELECT s.id, u.label FROM (SELECT id FROM der_order.t ORDER BY a LIMIT 3) s LEFT JOIN der_order.u u ON u.id = s.id ORDER BY s.id;

DELETE FROM _dynamodb.foo WHERE id LIKE "dl%";
INSERT INTO _dynamodb.foo SET id = "dl1", other = 10, comment = "p";
INSERT INTO _dynamodb.foo SET id = "dl2", other = 20, comment = "p";
INSERT INTO _dynamodb.foo SET id = "dl3", other = 30, comment = "q";
INSERT INTO _dynamodb.foo SET id = "dl4", other = 40, comment = "q";
INSERT INTO _dynamodb.foo SET id = "dl5", other = 50, comment = "q";

SELECT s.id, s.other FROM (SELECT id, other FROM _dynamodb.foo WHERE id LIKE "dl%" ORDER BY other DESC LIMIT 3) s ORDER BY s.id;
SELECT s.id FROM (SELECT id, other FROM _dynamodb.foo WHERE id LIKE "dl%" ORDER BY other LIMIT 2 OFFSET 1) s ORDER BY s.id;
SELECT COUNT(*) AS n, SUM(s.other) AS total FROM (SELECT other FROM _dynamodb.foo WHERE id LIKE "dl%" ORDER BY other DESC LIMIT 3) s;
SELECT s.id FROM (SELECT id FROM _dynamodb.foo WHERE id LIKE "dl%" ORDER BY other) s ORDER BY s.id;

DELETE FROM _dynamodb.foo WHERE id LIKE "dl%";
