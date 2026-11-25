CREATE DATABASE IF NOT EXISTS mem_json_functions;
USE mem_json_functions;

CREATE TEMPORARY TABLE jf (id INT PRIMARY KEY, doc JSON);
CREATE TEMPORARY TABLE jd (id INT PRIMARY KEY, doc JSON);
CREATE TEMPORARY TABLE jsum (id INT PRIMARY KEY, doc JSON);
CREATE TEMPORARY TABLE jg (id INT PRIMARY KEY, doc JSON);
CREATE TEMPORARY TABLE jr (id INT PRIMARY KEY, doc JSON);

INSERT INTO jf (id, doc) VALUES (1, '""'), (2, '"0"'), (3, '"x"'), (4, '[]'), (5, '{}'), (6, '[2]'), (7, '0'), (8, '0.5'), (9, 'false'), (10, 'null'), (11, '"7"'), (12, NULL);
INSERT INTO jd (id, doc) VALUES (1, '"2020-01-02"'), (2, '"2020-01-02 03:04:05"'), (3, '"2019-12-31"');
INSERT INTO jsum (id, doc) VALUES (1, '42'), (2, '"7"'), (3, 'null'), (4, NULL);
INSERT INTO jg (id, doc) VALUES (1, 'null'), (2, 'null'), (3, NULL), (4, NULL);
INSERT INTO jr (id, doc) VALUES (1, '-2.5'), (2, '2.5'), (3, '3'), (4, 'null'), (5, NULL);

SELECT id, NOT doc AS v FROM jf ORDER BY id;
SELECT id, doc AND 1 AS v FROM jf ORDER BY id;
SELECT id, doc OR 0 AS v FROM jf ORDER BY id;
SELECT id, doc XOR 0 AS v FROM jf ORDER BY id;
SELECT id, doc IS TRUE AS v FROM jf ORDER BY id;
SELECT id, doc IS FALSE AS v FROM jf ORDER BY id;
SELECT id FROM jf WHERE doc ORDER BY id;
SELECT id FROM jf WHERE NOT doc ORDER BY id;
SELECT id FROM jf WHERE doc IN (7, 8) ORDER BY id;
SELECT id FROM jf WHERE doc NOT IN (7, 8) ORDER BY id;
SELECT id FROM jf WHERE doc = 7 ORDER BY id;
SELECT id FROM jf WHERE doc = 0 ORDER BY id;
SELECT id FROM jf WHERE doc < 8 ORDER BY id;
SELECT id FROM jf WHERE doc >= 0.5 ORDER BY id;
SELECT id FROM jf WHERE doc = '7' ORDER BY id;
SELECT id, NULLIF(doc, 0) AS v FROM jf ORDER BY id;

SELECT id, DATE(doc) AS v FROM jd ORDER BY id;
SELECT id, YEAR(doc) AS v FROM jd ORDER BY id;
SELECT id, MONTH(doc) AS v FROM jd ORDER BY id;
SELECT id, DAY(doc) AS v FROM jd ORDER BY id;
SELECT id, DATE_FORMAT(doc, '%Y/%m/%d') AS v FROM jd ORDER BY id;
SELECT id, DATEDIFF(doc, '2020-01-01') AS v FROM jd ORDER BY id;

SELECT SUM(doc) AS s, AVG(doc) AS a FROM jsum;
SELECT COUNT(*) AS c FROM jg GROUP BY doc ORDER BY c;

SELECT id, ROUND(doc) AS v FROM jr ORDER BY id;
