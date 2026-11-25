-- JSON comparison operators against scalar, object, array, and boolean values
CREATE DATABASE IF NOT EXISTS mem_json_ord;
USE mem_json_ord;

CREATE TEMPORARY TABLE jo (id INT PRIMARY KEY, doc JSON);
INSERT INTO jo (id, doc) VALUES (1, CAST('null' AS JSON)), (2, CAST('0' AS JSON)), (3, CAST('0.5' AS JSON)), (4, CAST('"abc"' AS JSON)), (5, CAST('false' AS JSON)), (6, CAST('true' AS JSON)), (7, CAST('[1,2]' AS JSON)), (8, CAST('{"a":1}' AS JSON)), (9, NULL);

SELECT id FROM jo WHERE doc < 8 ORDER BY id;
SELECT id FROM jo WHERE doc <= 0.5 ORDER BY id;
SELECT id FROM jo WHERE doc > 0 ORDER BY id;
SELECT id FROM jo WHERE doc >= 0.5 ORDER BY id;
SELECT id FROM jo WHERE doc = 0 ORDER BY id;
SELECT id FROM jo WHERE doc <> 0 ORDER BY id;
SELECT id FROM jo WHERE doc = 'abc' ORDER BY id;
SELECT id FROM jo WHERE doc = TRUE ORDER BY id;
SELECT id FROM jo WHERE doc = FALSE ORDER BY id;
SELECT id FROM jo WHERE doc = CAST('[1,2]' AS JSON) ORDER BY id;
SELECT id FROM jo WHERE doc = CAST('{"a":1}' AS JSON) ORDER BY id;
SELECT id FROM jo WHERE doc <=> NULL ORDER BY id;
SELECT id FROM jo WHERE doc <=> CAST('null' AS JSON) ORDER BY id;
SELECT id FROM jo WHERE doc IN (0, 'abc') ORDER BY id;
SELECT id FROM jo WHERE doc NOT IN (0, 'abc') ORDER BY id;
SELECT id, doc < 8 AS v FROM jo ORDER BY id;
SELECT id, doc >= 0.5 AS v FROM jo ORDER BY id;
SELECT id, doc = 0 AS v FROM jo ORDER BY id;
SELECT id, doc <=> 0 AS v FROM jo ORDER BY id;
SELECT id, NULLIF(doc, 0) AS v FROM jo ORDER BY id;
SELECT CAST('{"a":1}' AS JSON) = CAST('{"a":1}' AS JSON) AS v;
SELECT CAST('{"a":1}' AS JSON) < CAST('{"a":2}' AS JSON) AS v;
SELECT CAST('[1,2]' AS JSON) < CAST('[2]' AS JSON) AS v;
SELECT CAST('null' AS JSON) = CAST('null' AS JSON) AS v;

CREATE TEMPORARY TABLE jp (id INT PRIMARY KEY, doc JSON);
INSERT INTO jp (id, doc) VALUES (1, CAST('42' AS JSON)), (2, CAST('-2.5' AS JSON)), (3, CAST('0' AS JSON)), (4, CAST('"7"' AS JSON)), (5, CAST('"x"' AS JSON)), (6, CAST('""' AS JSON)), (7, CAST('true' AS JSON)), (8, CAST('false' AS JSON)), (9, CAST('null' AS JSON)), (10, NULL);
SELECT id FROM jp ORDER BY doc, id;
SELECT id FROM jp ORDER BY doc DESC, id;
SELECT MIN(doc) AS mn, MAX(doc) AS mx FROM jp;

CREATE TEMPORARY TABLE jn (id INT PRIMARY KEY, doc JSON);
INSERT INTO jn (id, doc) VALUES (1, CAST('{"a":1}' AS JSON)), (2, CAST('{"a":2}' AS JSON)), (3, CAST('{"b":0}' AS JSON)), (4, CAST('{}' AS JSON)), (5, NULL);
SELECT MIN(doc) AS mn, MAX(doc) AS mx FROM jn WHERE id <= 4;

-- Cleanup
USE _dynamodb;
DROP DATABASE mem_json_ord;
