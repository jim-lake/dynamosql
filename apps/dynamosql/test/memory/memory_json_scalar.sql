CREATE DATABASE IF NOT EXISTS mem_json_scalar;
USE mem_json_scalar;

CREATE TEMPORARY TABLE js (id INT PRIMARY KEY, doc JSON);
CREATE TEMPORARY TABLE js_copy (id INT PRIMARY KEY, doc JSON);
CREATE TEMPORARY TABLE js_not_null (id INT PRIMARY KEY, doc JSON NOT NULL);

INSERT INTO js (id, doc) VALUES (1, '42'), (2, '-2.5'), (3, '0'), (4, '1000'), (5, '"7"'), (6, '"x"'), (7, '""'), (8, '"2020-01-02"'), (9, 'true'), (10, 'false'), (11, 'null'), (12, NULL);
INSERT INTO js_not_null (id, doc) VALUES (1, '"n"');

SELECT id, doc AS json_value FROM js ORDER BY id;
SELECT id, doc AS json_value FROM js_not_null ORDER BY id;
SELECT id FROM js WHERE doc IS NULL ORDER BY id;
SELECT id FROM js WHERE doc IS NOT NULL ORDER BY id;
SELECT id FROM js WHERE doc = CAST('"7"' AS JSON) ORDER BY id;
SELECT id FROM js WHERE doc = CAST('true' AS JSON) ORDER BY id;
SELECT id FROM js WHERE doc = CAST('null' AS JSON) ORDER BY id;
SELECT id FROM js WHERE doc = CAST('"2020-01-02"' AS JSON) ORDER BY id;
SELECT id FROM js WHERE doc = CAST('42' AS JSON) ORDER BY id;
SELECT id, JSON_TYPE(doc) AS doc_type FROM js ORDER BY id;
SELECT id, JSON_EXTRACT(doc, '$') AS json_value FROM js ORDER BY id;
SELECT id, doc -> '$' AS json_value FROM js ORDER BY id;
SELECT id, JSON_VALID(doc) AS valid FROM js ORDER BY id;
SELECT id, JSON_LENGTH(doc) AS json_len FROM js ORDER BY id;

UPDATE js SET doc = '"changed"' WHERE id = 1;
UPDATE js SET doc = '99' WHERE id = 2;
UPDATE js SET doc = '99' WHERE id = 3;
UPDATE js SET doc = 'null' WHERE id = 4;
UPDATE js SET doc = NULL WHERE id = 5;
UPDATE js SET doc = '"7"' WHERE id = 6;
UPDATE js SET doc = 'null' WHERE id = 7;
SELECT id, doc AS json_value FROM js ORDER BY id;

START TRANSACTION;
UPDATE js SET doc = '"rolled back"' WHERE id = 1;
SELECT id, doc AS json_value FROM js WHERE id = 1;
ROLLBACK;
SELECT id, doc AS json_value FROM js WHERE id = 1;

REPLACE INTO js (id, doc) VALUES (1, '"replaced"');
REPLACE INTO js (id, doc) VALUES (2, '-2.5');
SELECT id, doc AS json_value FROM js WHERE id IN (1, 2) ORDER BY id;

INSERT IGNORE INTO js (id, doc) VALUES (1, '"ignored"');
INSERT IGNORE INTO js (id, doc) VALUES (13, '"added"');
SELECT id, doc AS json_value FROM js WHERE id IN (1, 13) ORDER BY id;

INSERT INTO js_copy (id, doc) SELECT id, doc FROM js ORDER BY id;
SELECT id, doc AS json_value FROM js_copy ORDER BY id;

INSERT INTO js_not_null (id, doc) SELECT id + 10, doc FROM js WHERE id = 13;
SELECT id, doc AS json_value FROM js_not_null ORDER BY id;
