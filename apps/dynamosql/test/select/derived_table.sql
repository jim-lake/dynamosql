-- Derived tables in FROM and JOIN (SELECT ...) alias, on temporary tables
CREATE DATABASE IF NOT EXISTS der_mem;
CREATE TEMPORARY TABLE der_mem.t (id INT PRIMARY KEY, c INT, name VARCHAR(20));
CREATE TEMPORARY TABLE der_mem.u (id INT PRIMARY KEY, c INT, nc INT);
INSERT INTO der_mem.t (id, c, name) VALUES (1, 5, 'Alpha'), (2, 7, 'beta'), (3, 7, 'gamma'), (4, NULL, 'delta');
INSERT INTO der_mem.u (id, c, nc) VALUES (1, 50, 500), (3, 70, 700);
SELECT s.id, s.c FROM (SELECT id, c FROM der_mem.t WHERE c > 5) s ORDER BY s.id;
SELECT s.id, s.c FROM (SELECT id, c FROM der_mem.t WHERE c > 5) AS s ORDER BY s.id DESC;
SELECT s.* FROM (SELECT id AS k, UPPER(name) AS n FROM der_mem.t) s ORDER BY s.k;
SELECT s.k FROM (SELECT id AS k FROM der_mem.t WHERE id < 3) s WHERE s.k > 1 ORDER BY s.k;
SELECT id FROM (SELECT id FROM der_mem.t WHERE id = 1) s;
SELECT s.id FROM (SELECT id FROM der_mem.t WHERE id > 100) s;
SELECT s.id FROM (SELECT id FROM der_mem.t WHERE id > 1 ORDER BY id DESC LIMIT 2) s ORDER BY s.id;
SELECT outer_s.id FROM (SELECT id FROM (SELECT id FROM der_mem.t WHERE id > 2) inner_s) outer_s ORDER BY outer_s.id;
SELECT s.id, s.name FROM (SELECT id, name FROM der_mem.t) s WHERE s.name = 'ALPHA';
SELECT s.id FROM (SELECT id, name FROM der_mem.t) s WHERE s.name LIKE 'a%';
SELECT s.x FROM (SELECT c + 1 AS x FROM der_mem.t WHERE id > 100) s;
SELECT s.id FROM (SELECT id FROM der_mem.t WHERE c IS NULL) s;
SELECT s.id FROM (SELECT 1 AS id) s;

-- Aggregates over derived tables
SELECT COUNT(*) AS n, MAX(s.c) AS m FROM (SELECT id, c FROM der_mem.t) s;
SELECT s.c, COUNT(*) FROM (SELECT c FROM der_mem.t WHERE c IS NOT NULL) s GROUP BY s.c ORDER BY s.c;
SELECT COUNT(*) FROM (SELECT id FROM der_mem.t WHERE id > 1) s;
SELECT s.x, COUNT(*) FROM (SELECT c + 1 AS x FROM der_mem.t) s GROUP BY s.x ORDER BY s.x;

-- Joins with derived tables on temporary tables
SELECT s.id, u.c AS uc FROM (SELECT id FROM der_mem.t) s LEFT JOIN der_mem.u u ON u.id = s.id ORDER BY s.id;
SELECT s.id, u.nc FROM (SELECT id FROM der_mem.t) s JOIN der_mem.u u USING (id) ORDER BY s.id;
SELECT s.id FROM (SELECT id FROM der_mem.t) s NATURAL JOIN der_mem.u ORDER BY s.id;
SELECT t.id, s.n FROM der_mem.t t JOIN (SELECT id, id * 10 AS n FROM der_mem.u) s ON s.id = t.id ORDER BY t.id;
SELECT u.c, s.id FROM der_mem.u u JOIN (SELECT id FROM der_mem.t WHERE c IS NOT NULL) s ON s.id = u.id ORDER BY s.id;

-- Derived tables joined with DynamoDB tables (pushdown on base tables)
SELECT s.id, f.other FROM (SELECT id FROM _dynamodb.foo WHERE id > '110') s JOIN _dynamodb.foo f ON f.id = s.id ORDER BY s.id;
SELECT s.id, f.comment FROM (SELECT id FROM _dynamodb.foo) s JOIN _dynamodb.foo f ON f.id = s.id WHERE f.id = '111' ORDER BY s.id;
SELECT s.id, b.id AS bid FROM (SELECT id FROM _dynamodb.foo WHERE id < '3') s LEFT JOIN _dynamodb.bar b ON b.id = s.id ORDER BY s.id;
SELECT f.id FROM _dynamodb.foo f JOIN (SELECT other FROM _dynamodb.foo WHERE id = '111') s ON s.other = f.other ORDER BY f.id;
SELECT s.id FROM (SELECT id, other FROM _dynamodb.foo) s WHERE s.other = (SELECT other FROM _dynamodb.foo WHERE id = '111') ORDER BY s.id;
SELECT s.n FROM (SELECT COUNT(*) AS n FROM _dynamodb.foo) s;
SELECT s.id, COUNT(*) AS c FROM (SELECT id FROM _dynamodb.foo) s GROUP BY s.id ORDER BY s.id;
SELECT s.* FROM (SELECT id, other FROM _dynamodb.foo WHERE id = '111') s;

-- UPDATE with a derived table as a join source
UPDATE der_mem.t t JOIN (SELECT id, nc FROM der_mem.u) s ON s.id = t.id SET t.c = s.nc;
SELECT id, c FROM der_mem.t ORDER BY id;
UPDATE der_mem.t t JOIN (SELECT id FROM der_mem.u WHERE nc > 600) s ON s.id = t.id SET t.name = 'matched';
SELECT id, name FROM der_mem.t ORDER BY id;

-- Derived table errors
SELECT s.id FROM (SELECT id FROM der_mem.t) ORDER BY 1;
SELECT s.id FROM (SELECT id, id FROM der_mem.t) s;
