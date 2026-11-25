CREATE DATABASE IF NOT EXISTS mem_json_gj;
USE mem_json_gj;

CREATE TEMPORARY TABLE ga (id INT PRIMARY KEY, doc JSON, k INT);
INSERT INTO ga (id, doc, k) VALUES (1, '1', 1), (2, '1', 1), (3, '"1"', 2), (4, 'true', 2), (5, 'null', 3), (6, NULL, 3), (7, NULL, 3), (8, '2.5', 4), (9, '"a"', 4), (10, '{"x":1,"y":"p"}', 5), (11, '{"x":2,"y":"p"}', 5), (12, '{"x":1,"y":"q"}', 6);

SELECT doc, COUNT(*) AS c FROM ga WHERE JSON_TYPE(doc) IN ('INTEGER', 'STRING', 'BOOLEAN', 'NULL', 'DOUBLE') OR doc IS NULL GROUP BY doc ORDER BY doc, c;
SELECT doc, COUNT(*) AS c FROM ga WHERE id <= 9 GROUP BY doc ORDER BY c, id;
SELECT k, COUNT(doc) AS c, COUNT(*) AS n FROM ga GROUP BY k ORDER BY k;
SELECT k, MIN(doc) AS mn, MAX(doc) AS mx FROM ga WHERE id <= 9 GROUP BY k ORDER BY k;
SELECT doc -> '$.y' AS y, COUNT(*) AS c FROM ga WHERE id >= 10 GROUP BY doc -> '$.y' ORDER BY y;
SELECT doc ->> '$.y' AS y, COUNT(*) AS c FROM ga WHERE id >= 10 GROUP BY doc ->> '$.y' ORDER BY y;
SELECT JSON_EXTRACT(doc, '$.x') AS x, COUNT(*) AS c FROM ga WHERE id >= 10 GROUP BY JSON_EXTRACT(doc, '$.x') ORDER BY x;
SELECT JSON_EXTRACT(doc, '$.x') AS x, doc ->> '$.y' AS y, COUNT(*) AS c FROM ga WHERE id >= 10 GROUP BY JSON_EXTRACT(doc, '$.x'), doc ->> '$.y' ORDER BY x, y;
SELECT doc, COUNT(*) AS c FROM ga WHERE id <= 9 GROUP BY doc HAVING COUNT(*) > 1 ORDER BY doc;
SELECT doc, COUNT(*) AS c FROM ga WHERE id <= 9 GROUP BY doc HAVING doc = CAST('1' AS JSON) ORDER BY doc;
SELECT DISTINCT doc FROM ga WHERE id <= 9 ORDER BY doc;
SELECT DISTINCT doc -> '$.y' AS y FROM ga WHERE id >= 10 ORDER BY y;
SELECT DISTINCT doc ->> '$.y' AS y FROM ga WHERE id >= 10 ORDER BY y;
SELECT JSON_ARRAYAGG(doc) AS a FROM ga WHERE id IN (1, 3, 4);

CREATE TEMPORARY TABLE gb (id INT PRIMARY KEY, doc JSON, label VARCHAR(10));
INSERT INTO gb (id, doc, label) VALUES (1, '1', 'one'), (2, '"1"', 'str'), (3, 'true', 'bool'), (4, 'null', 'jnull'), (5, NULL, 'sqlnull'), (6, '2.5', 'dbl'), (7, '{"x":1,"y":"p"}', 'obj'), (8, '[1,2]', 'arr');

SELECT a.id, b.id AS bid, b.label FROM ga a JOIN gb b ON a.doc = b.doc WHERE a.id IN (1, 3, 4, 5, 8, 9) ORDER BY a.id, b.id;
SELECT a.id, b.id AS bid, b.label FROM ga a LEFT JOIN gb b ON a.doc = b.doc WHERE a.id <= 9 ORDER BY a.id, b.id;
SELECT a.id, b.id AS bid, b.label FROM ga a JOIN gb b ON a.doc <=> b.doc WHERE a.id IN (5, 6, 7) ORDER BY a.id, b.id;
SELECT a.id, b.id AS bid FROM ga a JOIN gb b USING (doc) WHERE a.id <= 9 ORDER BY a.id, b.id;
SELECT a.id, b.id AS bid FROM ga a JOIN gb b ON a.doc = CAST('1' AS JSON) AND b.doc = a.doc ORDER BY a.id, b.id;
SELECT a.id, b.label FROM ga a JOIN gb b ON a.doc -> '$.x' = b.doc -> '$.x' WHERE a.id >= 10 ORDER BY a.id, b.id;
SELECT a.id, b.label FROM ga a JOIN gb b ON a.doc ->> '$.y' = b.doc ->> '$.y' WHERE a.id >= 10 ORDER BY a.id, b.id;
SELECT a.id, b.label FROM ga a JOIN gb b ON a.doc ->> '$.y' = b.label WHERE a.id >= 10 ORDER BY a.id, b.id;
SELECT a.id, b.label FROM ga a JOIN gb b ON JSON_EXTRACT(a.doc, '$.x') = b.id WHERE a.id >= 10 ORDER BY a.id, b.id;
SELECT a.k, COUNT(*) AS c FROM ga a JOIN gb b ON a.doc = b.doc GROUP BY a.k ORDER BY a.k;
SELECT b.label, COUNT(a.id) AS c FROM gb b LEFT JOIN ga a ON a.doc = b.doc GROUP BY b.label ORDER BY b.label;
SELECT a.id, b.doc FROM ga a JOIN gb b ON a.k = b.id WHERE a.id <= 4 ORDER BY a.id;
SELECT a.id, b.id AS bid FROM ga a JOIN gb b ON a.doc = b.doc ORDER BY b.doc, a.id, b.id;
CREATE TEMPORARY TABLE pl (id INT PRIMARY KEY, s VARCHAR(5));
INSERT INTO pl VALUES (1,'a'),(2,'a'),(3,'b');
SELECT DISTINCT s AS y FROM pl WHERE id >= 1 ORDER BY y;
