-- JSON column create
CREATE DATABASE IF NOT EXISTS mem_json_test;
USE mem_json_test;

CREATE TEMPORARY TABLE json_temp (id INT PRIMARY KEY, doc JSON);
CREATE TEMPORARY TABLE json_not_null (id INT PRIMARY KEY, doc JSON NOT NULL);
CREATE TEMPORARY TABLE json_default_null (id INT PRIMARY KEY, doc JSON DEFAULT NULL);
CREATE TEMPORARY TABLE json_mixed (id INT PRIMARY KEY, doc JSON, label VARCHAR(256), flag BOOLEAN);

-- JSON column insert
INSERT INTO json_mixed (id, doc, label, flag) VALUES (1, JSON_ARRAY(1, 'a', TRUE), 'first', TRUE);
INSERT INTO json_mixed (id, doc, label, flag) VALUES (2, NULL, 'null doc', FALSE);
INSERT INTO json_mixed (id, doc, label, flag) VALUES (3, '[1, 2]', 'text literal', NULL);
INSERT INTO json_mixed (id, doc, label) VALUES (4, JSON_ARRAY(), 'empty');
INSERT INTO json_mixed (id, label) VALUES (5, 'no doc');
INSERT INTO json_mixed (id, doc, label) VALUES (6, JSON_ARRAY(JSON_ARRAY(1, 2), JSON_ARRAY()), 'nested');
INSERT INTO json_mixed (id, doc, label) VALUES (7, JSON_ARRAY(1.0, 1e20, -0.5), 'numbers');
INSERT INTO json_mixed (id, doc, label) VALUES (8, JSON_ARRAY('say "hi"', 'back\\slash'), 'escapes');
INSERT INTO json_mixed (id, doc, label) VALUES (9, JSON_ARRAY(9007199254740993), 'bigint');
INSERT INTO json_mixed (id, doc, label) VALUES (10, JSON_ARRAY(1 = 1, 1 = 2), 'comparisons');
REPLACE INTO json_mixed (id, doc, label) VALUES (1, JSON_ARRAY(9), 'replaced');
INSERT IGNORE INTO json_mixed (id, doc, label) VALUES (1, JSON_ARRAY(8), 'ignored');
INSERT INTO json_mixed (id, doc, label) SELECT 13, JSON_ARRAY('from', 'select'), 'insert select';
INSERT INTO json_temp (id, doc) VALUES (1, JSON_ARRAY(1, 2)), (2, NULL), (3, JSON_ARRAY());
INSERT INTO json_not_null (id, doc) VALUES (1, JSON_ARRAY(1));
INSERT INTO json_default_null (id) VALUES (1);

-- JSON column select
SELECT id, doc AS json_value FROM json_mixed ORDER BY id;
SELECT id, doc AS json_value, label FROM json_mixed WHERE id <= 3 ORDER BY id;
SELECT doc AS json_value FROM json_mixed WHERE id = 1;
SELECT id FROM json_mixed WHERE doc IS NULL ORDER BY id;
SELECT id FROM json_mixed WHERE doc IS NOT NULL ORDER BY id;
SELECT id, doc AS json_value FROM json_temp ORDER BY id;
SELECT id, doc AS json_value FROM json_not_null ORDER BY id;
SELECT id, doc AS json_value FROM json_default_null ORDER BY id;
SELECT id, doc AS json_value FROM json_mixed ORDER BY id LIMIT 2 OFFSET 1;
SELECT doc AS json_value FROM json_mixed WHERE id = 6;

-- JSON_ARRAY in select
SELECT JSON_ARRAY() AS json_value;
SELECT JSON_ARRAY(1, 'a', TRUE, NULL, 2.5) AS json_value;
SELECT JSON_ARRAY(JSON_ARRAY(1), 'x') AS json_value;
SELECT JSON_ARRAY(JSON_ARRAY(JSON_ARRAY(1))) AS json_value;
SELECT JSON_ARRAY(NULL, 'x') AS json_value;
SELECT JSON_ARRAY('') AS json_value;
SELECT JSON_ARRAY(1.0, 1.50, 100.25, 0.0) AS json_value;
SELECT JSON_ARRAY(1e20, -0.5) AS json_value;
SELECT JSON_ARRAY(-1, -2.5) AS json_value;
SELECT JSON_ARRAY(9007199254740993) AS json_value;
SELECT JSON_ARRAY('say "hi"', 'uni é 中') AS json_value;
SELECT JSON_ARRAY('back\\slash') AS json_value;
SELECT JSON_ARRAY(1 = 1, 1 = 2) AS json_value;
SELECT JSON_ARRAY(1 + 2, 10 / 4, 7 DIV 2) AS json_value;
SELECT JSON_ARRAY(LENGTH('abc'), UPPER('abc')) AS json_value;
SELECT JSON_ARRAY('2020-01-02') AS json_value;
SELECT JSON_ARRAY(CAST('2020-01-02' AS DATE)) AS json_value;
SELECT JSON_ARRAY(CAST('2020-01-02 03:04:05' AS DATETIME)) AS json_value;
SELECT JSON_ARRAY(CAST('03:04:05' AS TIME)) AS json_value;
SELECT JSON_ARRAY(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12) AS json_value;

-- JSON_ARRAY with column references
SELECT id, JSON_ARRAY(id, label) AS json_value FROM json_mixed WHERE id <= 3 ORDER BY id;
SELECT JSON_ARRAY(doc) AS json_value FROM json_mixed WHERE id = 1;
SELECT id, JSON_ARRAY(id, doc) AS json_value FROM json_temp ORDER BY id;
SELECT JSON_ARRAY(id, flag) AS json_value FROM json_mixed WHERE id = 1;

-- JSON_ARRAY values stored into JSON columns
INSERT INTO json_temp (id, doc) VALUES (4, JSON_ARRAY('stored', 1));
SELECT id, doc AS json_value FROM json_temp WHERE id = 4;

-- Cleanup
USE _dynamodb;
DROP DATABASE mem_json_test;
