CREATE DATABASE IF NOT EXISTS having_mem;
CREATE TEMPORARY TABLE having_mem.t (id INT PRIMARY KEY, c INT, name VARCHAR(20), amount INT);
CREATE TEMPORARY TABLE having_mem.u (id INT PRIMARY KEY, c INT);
CREATE TEMPORARY TABLE having_mem.s (id INT PRIMARY KEY, label VARCHAR(10));
INSERT INTO having_mem.t (id, c, name, amount) VALUES (1, 7, 'alpha', 10), (2, 7, 'beta', 20), (3, 8, 'gamma', 30), (4, 9, NULL, 40), (5, NULL, 'alpha', 50), (6, 8, 'delta', 60), (7, 8, 'epsilon', 70);
INSERT INTO having_mem.u (id, c) VALUES (1, 5), (2, 7), (3, 7), (4, NULL);
INSERT INTO having_mem.s (id, label) VALUES (1, '1'), (2, '0'), (3, 'x'), (4, '2x'), (5, ''), (6, NULL), (7, '0.5');
SELECT id, c, name, amount FROM having_mem.t ORDER BY id;

-- HAVING on grouped rows with an aggregate in the condition
SELECT c, COUNT(*) AS cnt FROM having_mem.t GROUP BY c HAVING COUNT(*) > 1 ORDER BY c;
SELECT c, COUNT(*) FROM having_mem.t GROUP BY c HAVING COUNT(*) = 1 ORDER BY c;
SELECT c, COUNT(*) AS cnt FROM having_mem.t GROUP BY c HAVING COUNT(*) > 100 ORDER BY c;
SELECT c, COUNT(*) AS cnt FROM having_mem.t GROUP BY c HAVING COUNT(*) >= 0 ORDER BY c;
SELECT c, SUM(amount) AS total FROM having_mem.t GROUP BY c HAVING SUM(amount) >= 100 ORDER BY c;
SELECT c, SUM(amount) AS total FROM having_mem.t GROUP BY c HAVING SUM(amount) < 100 ORDER BY c;
SELECT c, MAX(amount) AS hi, MIN(amount) AS lo FROM having_mem.t GROUP BY c HAVING MAX(amount) - MIN(amount) > 10 ORDER BY c;
SELECT c, COUNT(*) AS cnt FROM having_mem.t GROUP BY c HAVING COUNT(*) * 2 > 4 ORDER BY c;
SELECT c, COUNT(*) AS cnt FROM having_mem.t GROUP BY c HAVING COUNT(*) IN (1, 3) ORDER BY c;
SELECT c, COUNT(*) AS cnt FROM having_mem.t GROUP BY c HAVING COUNT(*) BETWEEN 2 AND 3 ORDER BY c;
SELECT c, COUNT(*) AS cnt FROM having_mem.t GROUP BY c HAVING NOT COUNT(*) = 1 ORDER BY c;
SELECT c, COUNT(*) AS cnt FROM having_mem.t GROUP BY c HAVING COUNT(*) = 1 OR MAX(id) = 2 ORDER BY c;
SELECT c, COUNT(*) AS cnt FROM having_mem.t GROUP BY c HAVING COUNT(*) > 1 AND MAX(amount) > 25 ORDER BY c;
SELECT c, COUNT(*) AS cnt FROM having_mem.t GROUP BY c HAVING COUNT(*) > 1 AND c IS NOT NULL ORDER BY c;
SELECT c, COUNT(*) AS cnt FROM having_mem.t GROUP BY c HAVING (COUNT(*) > 1 AND MIN(id) > 1) OR c IS NULL ORDER BY c;
SELECT c, COUNT(*) AS cnt FROM having_mem.t GROUP BY c HAVING COUNT(*) IS NOT NULL ORDER BY c;
SELECT c, COUNT(*) AS cnt FROM having_mem.t GROUP BY c HAVING COUNT(DISTINCT name) > 1 ORDER BY c;

-- HAVING referencing select list aliases
SELECT c, COUNT(*) AS cnt FROM having_mem.t GROUP BY c HAVING cnt > 1 ORDER BY c;
SELECT c, COUNT(*) AS cnt FROM having_mem.t GROUP BY c HAVING cnt > 1 AND c IS NOT NULL ORDER BY c;
SELECT c, SUM(amount) + 1 AS s FROM having_mem.t GROUP BY c HAVING s > 100 ORDER BY c;
SELECT c, SUM(amount) AS total, COUNT(*) AS cnt FROM having_mem.t GROUP BY c HAVING total > 50 AND cnt < 3 ORDER BY c;
SELECT LOWER(name) AS ln, COUNT(*) AS cnt FROM having_mem.t WHERE name IS NOT NULL GROUP BY LOWER(name) HAVING ln LIKE 'a%' ORDER BY ln;
SELECT c AS grp, COUNT(*) AS cnt FROM having_mem.t GROUP BY c HAVING grp IS NULL OR grp = 9 ORDER BY grp;
SELECT c, COUNT(*) AS cnt FROM having_mem.t GROUP BY c HAVING cnt > 1 ORDER BY c DESC LIMIT 1;
SELECT c, COUNT(*) AS cnt FROM having_mem.t GROUP BY c HAVING cnt > 1 ORDER BY c DESC LIMIT 1 OFFSET 1;
SELECT c, COUNT(*) AS cnt FROM having_mem.t GROUP BY c HAVING cnt >= 1 ORDER BY cnt, c LIMIT 2;

-- HAVING on group keys and non-aggregated columns
SELECT c FROM having_mem.t GROUP BY c HAVING c > 7 ORDER BY c;
SELECT c FROM having_mem.t GROUP BY c HAVING c IS NULL;
SELECT c FROM having_mem.t GROUP BY c HAVING c IS NOT NULL ORDER BY c;
SELECT c, COUNT(*) AS cnt FROM having_mem.t GROUP BY c HAVING c = 8 ORDER BY c;
SELECT c, COUNT(*) AS cnt FROM having_mem.t GROUP BY c HAVING c IN (7, 9) ORDER BY c;
SELECT c, COUNT(*) AS cnt FROM having_mem.t GROUP BY 1 HAVING COUNT(*) > 1 ORDER BY 1;
SELECT name, COUNT(*) AS cnt FROM having_mem.t GROUP BY name HAVING COUNT(*) > 1 ORDER BY name;
SELECT name, COUNT(*) AS cnt FROM having_mem.t GROUP BY name HAVING name IS NULL OR cnt = 1 ORDER BY name;
SELECT c, COUNT(*) AS cnt FROM having_mem.t GROUP BY c, name HAVING COUNT(*) > 0 AND c = 7 ORDER BY c, name;

-- HAVING referencing aggregates that are not in the select list
SELECT c, MAX(amount) AS hi FROM having_mem.t GROUP BY c HAVING MAX(id) > 4 ORDER BY c;
SELECT c FROM having_mem.t GROUP BY c HAVING MAX(id) > 4 ORDER BY c;
SELECT c FROM having_mem.t GROUP BY c HAVING SUM(amount) = 30;
SELECT name FROM having_mem.t GROUP BY name HAVING AVG(amount) > 30 ORDER BY name;

-- HAVING with a scalar subquery
SELECT c, SUM(amount) AS total FROM having_mem.t GROUP BY c HAVING SUM(amount) > (SELECT MAX(c) * 10 FROM having_mem.u) ORDER BY c;
SELECT c, COUNT(*) AS cnt FROM having_mem.t GROUP BY c HAVING COUNT(*) > (SELECT COUNT(*) FROM having_mem.u WHERE c IS NULL) ORDER BY c;
SELECT c, COUNT(*) AS cnt FROM having_mem.t GROUP BY c HAVING COUNT(*) > (SELECT COUNT(*) FROM having_mem.u WHERE c = 99) ORDER BY c;

-- HAVING with a WHERE clause and an empty input
SELECT c, COUNT(*) AS cnt FROM having_mem.t WHERE amount > 10 GROUP BY c HAVING COUNT(*) > 1 ORDER BY c;
SELECT c, COUNT(*) AS cnt FROM having_mem.t WHERE id > 100 GROUP BY c HAVING COUNT(*) > 0 ORDER BY c;
SELECT c, COUNT(*) AS cnt FROM having_mem.t WHERE id > 100 GROUP BY c HAVING COUNT(*) = 0 ORDER BY c;

-- HAVING without GROUP BY (implicit single group)
SELECT COUNT(*) AS cnt FROM having_mem.t HAVING COUNT(*) > 5;
SELECT COUNT(*) AS cnt FROM having_mem.t HAVING COUNT(*) > 100;
SELECT COUNT(*) AS cnt FROM having_mem.t HAVING cnt = 7;
SELECT SUM(amount) FROM having_mem.t HAVING SUM(amount) = 280;
SELECT MAX(id) FROM having_mem.t HAVING MAX(id) > 6;
SELECT COUNT(*) FROM having_mem.t WHERE id > 100 HAVING COUNT(*) = 0;
SELECT COUNT(*) FROM having_mem.t WHERE id > 100 HAVING COUNT(*) > 0;
SELECT COUNT(*) AS n, MAX(id) AS top FROM having_mem.t WHERE id > 100 HAVING n = 0;
SELECT c, COUNT(*) FROM having_mem.t WHERE id > 100 HAVING COUNT(*) = 0;
SELECT COUNT(*) AS cnt FROM having_mem.t HAVING cnt > 1 AND cnt < 10;
SELECT SUM(amount) + 1 AS s FROM having_mem.t HAVING s > 280;
SELECT COUNT(*) + 1 AS n FROM having_mem.t HAVING n > 7;
SELECT COUNT(*) AS n, SUM(amount) AS total FROM having_mem.t WHERE id > 100 HAVING n = 0;
SELECT MAX(c), COUNT(*) FROM having_mem.t WHERE id > 100;
SELECT COUNT(*) AS n, SUM(amount) AS total FROM having_mem.t WHERE id > 100;

-- Aggregates over NULL values and empty input (names and results)
CREATE TEMPORARY TABLE having_mem.n (id INT PRIMARY KEY, v INT);
INSERT INTO having_mem.n (id, v) VALUES (1, 10), (2, NULL), (3, 30), (4, NULL);
SELECT SUM(v) AS total FROM having_mem.n;
SELECT SUM(v) AS total FROM having_mem.n WHERE id = 2;
SELECT SUM(v) AS total FROM having_mem.n WHERE id > 100;
SELECT SUM(v) AS total FROM having_mem.n HAVING total IS NULL;
SELECT SUM(v) AS total FROM having_mem.n HAVING total > 35;
SELECT id, SUM(v) AS total FROM having_mem.n GROUP BY id HAVING total IS NULL ORDER BY id;
SELECT SUM(v) + 1 AS total FROM having_mem.n;
SELECT COUNT(v) AS cnt, COUNT(*) AS star, AVG(v) AS avg_v FROM having_mem.n HAVING cnt = 2;
SELECT MAX(c), MIN(c), AVG(c), SUM(c), COUNT(c), COUNT(*) FROM having_mem.t WHERE id > 100;
SELECT MAX(amount) AS hi, MIN(LOWER(name)) AS lo, AVG(amount) FROM having_mem.t WHERE id > 100;
SELECT JSON_ARRAYAGG(c), JSON_OBJECTAGG(id, c) FROM having_mem.t WHERE id > 100;

-- HAVING without GROUP BY or aggregates (row filter)
SELECT id, amount FROM having_mem.t HAVING amount > 40 ORDER BY id;
SELECT id AS x, amount FROM having_mem.t HAVING x > 5 ORDER BY x;
SELECT id, amount FROM having_mem.t HAVING id > 100 ORDER BY id;
SELECT * FROM having_mem.t HAVING amount > 60 ORDER BY id;

-- HAVING truthiness with boolean literals and comparisons
SELECT c, COUNT(*) AS cnt FROM having_mem.t GROUP BY c HAVING TRUE ORDER BY c;
SELECT c, COUNT(*) AS cnt FROM having_mem.t GROUP BY c HAVING FALSE ORDER BY c;
SELECT c, COUNT(*) AS cnt FROM having_mem.t GROUP BY c HAVING 1 = 1 AND 0 < 1 ORDER BY c;
SELECT COUNT(*) AS cnt FROM having_mem.t HAVING NOT FALSE;
SELECT id FROM having_mem.s HAVING TRUE ORDER BY id;

-- HAVING inside derived tables and joins
SELECT s.c, s.cnt FROM (SELECT c, COUNT(*) AS cnt FROM having_mem.t GROUP BY c HAVING COUNT(*) > 1) s ORDER BY s.c;
SELECT COUNT(*) AS n FROM (SELECT c FROM having_mem.t GROUP BY c HAVING COUNT(*) > 2) s;
SELECT s.n FROM (SELECT COUNT(*) AS n FROM having_mem.t WHERE id > 100) s;
SELECT t.c, COUNT(*) AS cnt FROM having_mem.t t JOIN having_mem.u u ON u.c = t.c GROUP BY t.c HAVING cnt > 1 ORDER BY t.c;
SELECT t.c, COUNT(*) AS cnt FROM having_mem.t t LEFT JOIN having_mem.u u ON u.c = t.c GROUP BY t.c HAVING COUNT(u.id) = 0 ORDER BY t.c;
SELECT c FROM having_mem.t GROUP BY c, name HAVING name = 'alpha' ORDER BY c;
SELECT COUNT(id) AS c FROM having_mem.t GROUP BY c HAVING c = 3;
SELECT COUNT(id) AS c FROM having_mem.t HAVING c = 7;
SELECT id, amount FROM having_mem.t HAVING having_mem.t.amount > 60 ORDER BY id;

-- HAVING on DynamoDB tables
INSERT IGNORE INTO _dynamodb.foo (id, other, comment) VALUES ("hav1", 100, "having a"), ("hav2", 100, "having a"), ("hav3", 200, "having b"), ("hav4", 300, "having c"), ("hav5", 300, "having c"), ("hav6", 300, "having c");
SELECT other, COUNT(*) AS cnt FROM _dynamodb.foo WHERE id LIKE "hav%" GROUP BY other HAVING COUNT(*) > 1 ORDER BY other;
SELECT comment, COUNT(*) AS cnt FROM _dynamodb.foo WHERE id LIKE "hav%" GROUP BY comment HAVING cnt = 1 ORDER BY comment;
SELECT comment, SUM(other) AS total FROM _dynamodb.foo WHERE id LIKE "hav%" GROUP BY comment HAVING total > 300 ORDER BY comment;
SELECT other, COUNT(*) AS cnt FROM _dynamodb.foo WHERE id LIKE "hav%" GROUP BY other HAVING MAX(id) > "hav3" ORDER BY other;
SELECT COUNT(*) AS cnt FROM _dynamodb.foo WHERE id LIKE "hav%" HAVING cnt = 6;
SELECT id, other FROM _dynamodb.foo WHERE id LIKE "hav%" HAVING other = 200 ORDER BY id;
DELETE FROM _dynamodb.foo WHERE id LIKE "hav%";
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "hav%" ORDER BY id;
