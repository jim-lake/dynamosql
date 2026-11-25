CREATE DATABASE IF NOT EXISTS mem_json_numeric;
USE mem_json_numeric;

CREATE TEMPORARY TABLE jn (id INT PRIMARY KEY, doc JSON);
CREATE TEMPORARY TABLE jn_obj (id INT PRIMARY KEY, doc JSON);

INSERT INTO jn (id, doc) VALUES (1, '42'), (2, '-2.5'), (3, '0'), (4, '1000'), (5, '"7"'), (6, '"x"'), (7, '""'), (8, '"2020-01-02"'), (9, 'true'), (10, 'false'), (11, 'null'), (12, NULL);
INSERT INTO jn_obj (id, doc) VALUES (1, '{"a":1}'), (2, '[2]');

SELECT id, ABS(doc) AS v FROM jn ORDER BY id;
SELECT id, ABS(JSON_EXTRACT(doc, '$')) AS v FROM jn ORDER BY id;
SELECT id, ABS(doc -> '$') AS v FROM jn ORDER BY id;
SELECT id, CEIL(doc) AS v FROM jn ORDER BY id;
SELECT id, CEIL(JSON_EXTRACT(doc, '$')) AS v FROM jn ORDER BY id;
SELECT id, CEIL(doc -> '$') AS v FROM jn ORDER BY id;
SELECT id, FLOOR(doc) AS v FROM jn ORDER BY id;
SELECT id, FLOOR(JSON_EXTRACT(doc, '$')) AS v FROM jn ORDER BY id;
SELECT id, FLOOR(doc -> '$') AS v FROM jn ORDER BY id;
SELECT id, SIGN(doc) AS v FROM jn ORDER BY id;
SELECT id, SIGN(JSON_EXTRACT(doc, '$')) AS v FROM jn ORDER BY id;
SELECT id, SIGN(doc -> '$') AS v FROM jn ORDER BY id;
SELECT id, SQRT(doc) AS v FROM jn ORDER BY id;
SELECT id, SQRT(JSON_EXTRACT(doc, '$')) AS v FROM jn ORDER BY id;
SELECT id, SQRT(doc -> '$') AS v FROM jn ORDER BY id;
SELECT id, POW(doc, 2) AS v FROM jn ORDER BY id;
SELECT id, POW(JSON_EXTRACT(doc, '$'), 2) AS v FROM jn ORDER BY id;
SELECT id, POW(doc -> '$', 2) AS v FROM jn ORDER BY id;
SELECT id, LN(doc) AS v FROM jn WHERE id IN (1, 3, 4) ORDER BY id;
SELECT id, LOG10(doc -> '$') AS v FROM jn WHERE id IN (1, 3, 4) ORDER BY id;
SELECT id, CAST(doc AS SIGNED) AS v FROM jn WHERE id NOT IN (2) ORDER BY id;
SELECT id, CAST(JSON_EXTRACT(doc, '$') AS SIGNED) AS v FROM jn WHERE id NOT IN (2) ORDER BY id;
SELECT id, CAST(doc -> '$' AS SIGNED) AS v FROM jn WHERE id NOT IN (2) ORDER BY id;

SELECT id, JSON_EXTRACT(doc, '$') AS v, doc -> '$' AS w FROM jn_obj ORDER BY id;
SELECT id, ABS(doc) AS v FROM jn_obj ORDER BY id;
SELECT id, CAST(doc AS SIGNED) AS v FROM jn_obj ORDER BY id;
SELECT id, CEIL(doc -> '$') AS v FROM jn_obj ORDER BY id;
