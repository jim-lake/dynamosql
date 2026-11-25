-- Bare scalar JSON column values in ordinary SQL constructs
CREATE DATABASE IF NOT EXISTS mem_json_ssql;
USE mem_json_ssql;

CREATE TEMPORARY TABLE js (id INT PRIMARY KEY, doc JSON, alt JSON, n INT, s VARCHAR(20));
INSERT INTO js (id, doc, alt, n, s) VALUES
  (1, '42', '42', 42, '42'),
  (2, '-2.5', '1', -2, '2.5'),
  (3, '0', 'false', 0, '0'),
  (4, '1000', NULL, 1000, 'x'),
  (5, '"7"', '"7"', 7, '7'),
  (6, '"x"', '"x"', NULL, 'x'),
  (7, '""', 'null', 0, ''),
  (8, 'true', 'true', 1, 'true'),
  (9, 'false', '0', 0, 'false'),
  (10, 'null', 'null', NULL, 'null'),
  (11, NULL, '"abc"', NULL, NULL),
  (12, '"abc"', NULL, 5, 'abc'),
  (13, NULL, NULL, 9, NULL);

CREATE TEMPORARY TABLE jnum (id INT PRIMARY KEY, doc JSON, k INT);
INSERT INTO jnum (id, doc, k) VALUES (1, '42', 1), (2, '-3', 1), (3, '0', 2), (4, '1000', 2), (5, '12.6', 3), (6, '7.5', 3), (7, NULL, 4), (8, 'null', 4);

-- WHERE with comparison operators against SQL literals and JSON columns
SELECT id FROM js WHERE doc = 42 ORDER BY id;
SELECT id FROM js WHERE doc <> 0 ORDER BY id;
SELECT id FROM js WHERE doc < 10 ORDER BY id;
SELECT id FROM js WHERE doc <= 0 ORDER BY id;
SELECT id FROM js WHERE doc > 0 ORDER BY id;
SELECT id FROM js WHERE doc >= -2.5 ORDER BY id;
SELECT id FROM js WHERE doc = '7' ORDER BY id;
SELECT id FROM js WHERE doc = 'x' ORDER BY id;
SELECT id FROM js WHERE doc <=> NULL ORDER BY id;
SELECT id FROM js WHERE doc <=> 1000 ORDER BY id;
SELECT id FROM js WHERE doc = alt ORDER BY id;
SELECT id FROM js WHERE doc <> alt ORDER BY id;
SELECT id FROM js WHERE doc < alt ORDER BY id;
SELECT id FROM js WHERE doc >= alt ORDER BY id;
SELECT id FROM js WHERE doc <=> alt ORDER BY id;
SELECT id FROM js WHERE doc = n ORDER BY id;
SELECT id FROM js WHERE doc <=> n ORDER BY id;
SELECT id FROM js WHERE doc = s ORDER BY id;
SELECT id, doc = alt AS eq, doc <=> alt AS nseq, doc < alt AS lt FROM js ORDER BY id;

-- IS NULL, IS NOT NULL, IS TRUE, IS FALSE
SELECT id FROM js WHERE doc IS NULL ORDER BY id;
SELECT id FROM js WHERE doc IS NOT NULL AND alt IS NOT NULL ORDER BY id;
SELECT id FROM js WHERE doc IS TRUE ORDER BY id;
SELECT id FROM js WHERE doc IS FALSE ORDER BY id;
SELECT id FROM js WHERE doc IS NOT TRUE ORDER BY id;

-- BETWEEN, IN, NOT IN, LIKE on numeric and string JSON values
SELECT id FROM js WHERE doc IN (0, 42, 'x') ORDER BY id;
SELECT id FROM js WHERE doc NOT IN (0, 42) ORDER BY id;
SELECT id FROM js WHERE doc IN ('x', 'abc') AND id < 13 ORDER BY id;
SELECT id FROM js WHERE doc LIKE 'x%' ORDER BY id;
SELECT id FROM js WHERE doc NOT LIKE '%a%' ORDER BY id;
SELECT id FROM js WHERE doc LIKE s ORDER BY id;
SELECT id FROM js WHERE s LIKE doc ORDER BY id;

-- CASE, simple and searched
SELECT id, CASE doc WHEN 42 THEN 'forty-two' WHEN 1000 THEN 'big' ELSE 'other' END AS v FROM jnum ORDER BY id;
SELECT id, CASE WHEN doc > 10 THEN 'gt' WHEN doc IS NULL THEN 'null' ELSE 'le' END AS v FROM jnum ORDER BY id;
SELECT id, CASE WHEN doc = alt THEN 'same' WHEN doc IS NULL THEN 'nul' ELSE 'diff' END AS v FROM js ORDER BY id;
SELECT id FROM js WHERE CASE WHEN doc IS NULL THEN 0 ELSE doc = alt END ORDER BY id;

-- COALESCE, IFNULL, NULLIF, IF
SELECT id, COALESCE(doc, k, -1) AS v FROM jnum ORDER BY id;
SELECT id, COALESCE(doc, 'none') AS v FROM js ORDER BY id;
SELECT id, IFNULL(doc, 'none') AS v FROM js ORDER BY id;
SELECT id, IFNULL(doc, -1) AS v FROM jnum ORDER BY id;
SELECT id, NULLIF(doc, 42) AS v FROM js ORDER BY id;
SELECT id, NULLIF(doc, alt) AS v FROM js ORDER BY id;
SELECT id, IF(doc, 'yes', 'no') AS v FROM js ORDER BY id;
SELECT id, IF(doc IS NULL, 'null', 'set') AS v FROM js ORDER BY id;
SELECT id, IF(doc > 0, doc, k) AS v FROM jnum ORDER BY id;

-- ORDER BY, LIMIT, OFFSET on numbers
SELECT id, doc FROM jnum ORDER BY doc, id;
SELECT id, doc FROM jnum ORDER BY doc DESC, id;
SELECT id, doc FROM jnum ORDER BY doc, id LIMIT 3;
SELECT id, doc FROM jnum ORDER BY doc DESC, id LIMIT 2 OFFSET 2;
SELECT id, doc FROM jnum ORDER BY doc, id LIMIT 2 OFFSET 4;
SELECT id, doc FROM jnum ORDER BY doc + 0, id;

-- GROUP BY, HAVING, aggregates over JSON numbers
SELECT k, COUNT(doc) AS c, COUNT(*) AS n FROM jnum GROUP BY k ORDER BY k;
SELECT k, MIN(doc) AS mn, MAX(doc) AS mx FROM jnum GROUP BY k ORDER BY k;
SELECT k, SUM(doc) AS total FROM jnum GROUP BY k ORDER BY k;
SELECT k, AVG(doc) AS a FROM jnum GROUP BY k ORDER BY k;
SELECT k, SUM(doc) AS total FROM jnum GROUP BY k HAVING SUM(doc) > 10 ORDER BY k;
SELECT k, COUNT(*) AS c FROM jnum GROUP BY k HAVING MAX(doc) > 0 AND COUNT(doc) > 0 ORDER BY k;
SELECT MIN(doc) AS mn, MAX(doc) AS mx, SUM(doc) AS total, AVG(doc) AS a, COUNT(doc) AS c FROM jnum;
SELECT COUNT(doc) AS c, COUNT(*) AS n FROM js WHERE doc IS NULL;
SELECT COUNT(*) AS c FROM js WHERE doc = alt;
SELECT DISTINCT doc FROM jnum ORDER BY doc;
SELECT k, COUNT(DISTINCT doc) AS c FROM jnum GROUP BY k ORDER BY k;

-- Arithmetic and unary minus on JSON numbers
SELECT id, doc + 1 AS v FROM jnum ORDER BY id;
SELECT id, doc - 1 AS v FROM jnum ORDER BY id;
SELECT id, doc * 2 AS v FROM jnum ORDER BY id;
SELECT id, doc / 4 AS v FROM jnum ORDER BY id;
SELECT id, doc % 3 AS v, MOD(doc, 4) AS m FROM jnum ORDER BY id;
SELECT id, -doc AS v FROM jnum ORDER BY id;
SELECT id, doc + n AS v FROM js WHERE id <= 4 ORDER BY id;
SELECT id, doc * alt AS v FROM js WHERE id IN (1, 3, 5, 6) ORDER BY id;
SELECT id, doc + 1 AS v FROM js WHERE id IN (5, 8) ORDER BY id;

-- Math functions on JSON numbers
SELECT id, ROUND(doc, 1) AS v FROM jnum ORDER BY id;
SELECT id, ROUND(doc, -1) AS v FROM jnum ORDER BY id;
SELECT id, ABS(doc) AS v, FLOOR(doc) AS f, CEIL(doc) AS c FROM jnum WHERE doc IS NULL OR doc <> 7.5 ORDER BY id;

-- String functions on JSON strings and scalars
SELECT id, LENGTH(doc) AS v, CHAR_LENGTH(doc) AS c FROM js WHERE id IN (1, 5, 6, 7, 12) ORDER BY id;
SELECT id, SUBSTRING(doc, 1, 2) AS v FROM js WHERE id IN (1, 5, 12) ORDER BY id;

-- JOIN with JSON keys against JSON, INT, and VARCHAR columns
CREATE TEMPORARY TABLE jt (id INT PRIMARY KEY, doc JSON, vc VARCHAR(20), ni INT);
INSERT INTO jt (id, doc, vc, ni) VALUES (1, '42', '42', 42), (2, '"x"', 'x', 0), (3, 'true', 'true', 1), (4, 'null', 'null', NULL), (5, '"7"', '7', 7), (6, NULL, NULL, 0);

SELECT a.id, b.id AS bid FROM js a JOIN jt b ON a.doc = b.doc ORDER BY a.id, b.id;
SELECT a.id, b.id AS bid FROM js a LEFT JOIN jt b ON a.doc = b.doc ORDER BY a.id, b.id;
SELECT a.id, b.id AS bid FROM js a JOIN jt b ON a.doc <=> b.doc ORDER BY a.id, b.id;
SELECT a.id, b.id AS bid FROM js a JOIN jt b USING (doc) ORDER BY a.id, b.id;
SELECT a.id, b.id AS bid FROM js a LEFT JOIN jt b USING (doc) ORDER BY a.id, b.id;
SELECT a.id, b.id AS bid FROM js a JOIN jt b ON a.doc = b.vc ORDER BY a.id, b.id;
SELECT a.id, b.id AS bid FROM js a JOIN jt b ON a.s = b.doc ORDER BY a.id, b.id;
SELECT a.id, b.id AS bid FROM js a JOIN jt b ON a.n = b.doc ORDER BY a.id, b.id;
SELECT a.id, b.id AS bid FROM js a JOIN jt b ON a.doc = b.ni ORDER BY a.id, b.id;
SELECT a.id, b.id AS bid FROM js a JOIN jt b ON a.n = b.ni ORDER BY a.id, b.id;
SELECT a.id, b.id AS bid FROM jnum a JOIN jt b ON a.doc = b.doc WHERE a.k = 1 ORDER BY a.id, b.id;
SELECT b.id, COUNT(a.id) AS c FROM jt b LEFT JOIN js a ON a.doc = b.doc GROUP BY b.id ORDER BY b.id;

-- Derived tables with JSON columns
SELECT d.id, d.v FROM (SELECT id, doc AS v FROM js WHERE doc IS NOT NULL) d WHERE d.v > 0 ORDER BY d.id;
SELECT d.v, COUNT(*) AS c FROM (SELECT doc AS v FROM js) d GROUP BY d.v ORDER BY d.v;
SELECT d.id, d.v FROM (SELECT id, doc AS v FROM jnum ORDER BY doc DESC, id LIMIT 3) d ORDER BY d.id;
SELECT x.id FROM (SELECT id, doc FROM js) x JOIN (SELECT id, doc AS alt FROM jt) y ON x.doc = y.alt AND x.id = y.id ORDER BY x.id;

-- Scalar subquery returning a JSON value in WHERE
SELECT id FROM js WHERE doc = (SELECT doc FROM jt WHERE id = 5) ORDER BY id;
SELECT id FROM jnum WHERE doc > (SELECT MIN(doc) FROM jt WHERE id > 2) ORDER BY id;
SELECT id FROM js WHERE doc = (SELECT doc FROM jt WHERE id = 1) ORDER BY id;

-- DML with JSON scalar columns
CREATE TEMPORARY TABLE jcopy (id INT PRIMARY KEY, doc JSON, n INT);
INSERT INTO jcopy (id, doc, n) SELECT id, doc, n FROM js WHERE doc > 0 ORDER BY id;
INSERT INTO jcopy (id, doc, n) SELECT id + 100, alt, n FROM js WHERE doc = alt ORDER BY id;
INSERT INTO jcopy (id, doc, n) SELECT j.id + 200, j.doc, j.k FROM jnum j WHERE j.doc IS NULL OR j.doc = 0 ORDER BY j.id;
SELECT id, doc, n FROM jcopy ORDER BY id;

UPDATE jcopy SET doc = '5' WHERE doc = 42;
UPDATE jcopy SET doc = doc WHERE doc IS NULL;
UPDATE jcopy SET doc = 'null' WHERE doc = 1000;
UPDATE jcopy SET n = 3 WHERE n IS NULL AND doc IS NOT NULL;
UPDATE jcopy SET doc = NULL WHERE doc = '7';
SELECT id, doc, n FROM jcopy ORDER BY id;

UPDATE jcopy SET doc = '"moved"' WHERE doc IN (0, 'x') AND id < 300;
SELECT id, doc FROM jcopy ORDER BY id;

DELETE FROM jcopy WHERE doc IS NULL;
SELECT id, doc, n FROM jcopy ORDER BY id;
DELETE FROM jcopy WHERE n BETWEEN 0 AND 10 AND id > 200;
SELECT id, doc, n FROM jcopy ORDER BY id;

-- Literal text and DEFAULT for bare scalars
CREATE TEMPORARY TABLE jlit (id INT PRIMARY KEY, doc JSON NULL DEFAULT NULL, label VARCHAR(10));
INSERT INTO jlit (id, doc, label) VALUES (1, '1', 'int'), (2, '"abc"', 'str'), (3, 'true', 'bool'), (4, 'null', 'jnull'), (5, NULL, 'sqlnull');
INSERT INTO jlit (id, label) VALUES (6, 'default');
INSERT INTO jlit (id, doc, label) VALUES (8, '"1"', 'strnum');
SELECT id, doc, JSON_TYPE(doc) AS t, label FROM jlit ORDER BY id;
SELECT id, label FROM jlit WHERE doc = 1 ORDER BY id;
SELECT id, label FROM jlit WHERE doc = '1' ORDER BY id;
SELECT id, label FROM jlit WHERE doc IS NULL ORDER BY id;
SELECT id, label FROM jlit WHERE doc = 'abc' ORDER BY id;

-- Cleanup
USE _dynamodb;
DROP DATABASE mem_json_ssql;
