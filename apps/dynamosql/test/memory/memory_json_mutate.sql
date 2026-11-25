CREATE DATABASE IF NOT EXISTS mem_json_mutate;
USE mem_json_mutate;

CREATE TEMPORARY TABLE jm (id INT PRIMARY KEY, doc JSON, label VARCHAR(32));
INSERT INTO jm (id, doc, label) VALUES (1, '{"a":{"b":1},"list":[1,2,3]}', 'object');
INSERT INTO jm (id, doc, label) VALUES (2, '[1,{"k":"v"},[2,3]]', 'array');
INSERT INTO jm (id, doc, label) VALUES (3, '"plain"', 'scalar');
INSERT INTO jm (id, doc, label) VALUES (4, NULL, 'null');

SELECT id, doc AS json_value, label FROM jm ORDER BY id;
SELECT id, JSON_TYPE(doc) AS doc_type FROM jm ORDER BY id;
SELECT id, JSON_EXTRACT(doc, '$.a') AS json_value FROM jm WHERE id = 1;
SELECT id, doc -> '$[1].k' AS json_value FROM jm WHERE id = 2;
SELECT id, JSON_LENGTH(doc) AS json_len FROM jm ORDER BY id;
SELECT id, JSON_DEPTH(doc) AS json_depth FROM jm ORDER BY id;
SELECT id, doc = JSON_ARRAY(1, 2, 3) AS same_doc FROM jm WHERE id = 1;

SELECT id, JSON_SET(doc, '$.a.b', 2) AS json_value FROM jm WHERE id = 1;
SELECT id, doc AS json_value FROM jm WHERE id = 1;
SELECT id, JSON_INSERT(doc, '$.new', 'x') AS json_value FROM jm WHERE id = 1;
SELECT id, JSON_REPLACE(doc, '$.a.b', 9) AS json_value FROM jm WHERE id = 1;
SELECT id, JSON_REMOVE(doc, '$.list[0]') AS json_value FROM jm WHERE id = 1;
SELECT id, JSON_ARRAY_APPEND(doc, '$.list', 4) AS json_value FROM jm WHERE id = 1;
SELECT id, JSON_ARRAY_INSERT(doc, '$.list[0]', 0) AS json_value FROM jm WHERE id = 1;
SELECT id, JSON_MERGE_PATCH(doc, '{"a":{"c":3}}') AS json_value FROM jm WHERE id = 1;
SELECT id, doc AS json_value FROM jm WHERE id = 1;
SELECT id, JSON_SET(doc, '$[1].k', 'changed') AS json_value FROM jm WHERE id = 2;
SELECT id, doc AS json_value FROM jm WHERE id = 2;

START TRANSACTION;
UPDATE jm SET doc = JSON_SET(doc, '$.a.b', 100, '$.extra', TRUE) WHERE id = 1;
SELECT id, doc AS json_value FROM jm WHERE id = 1;
UPDATE jm SET doc = JSON_ARRAY_APPEND(doc, '$[1]', 'x') WHERE id = 2;
SELECT id, doc AS json_value FROM jm WHERE id = 2;
ROLLBACK;
SELECT id, doc AS json_value, label FROM jm ORDER BY id;

START TRANSACTION;
UPDATE jm SET doc = JSON_SET(doc, '$.a.b', 100) WHERE id = 1;
SELECT id, doc AS json_value FROM jm WHERE id = 1;
COMMIT;
SELECT id, doc AS json_value FROM jm WHERE id = 1;

UPDATE jm SET doc = JSON_REMOVE(doc, '$.list') WHERE id = 1;
UPDATE jm SET doc = '[1,{"k":"v"},[2,3]]' WHERE id = 1;
SELECT id, doc AS json_value FROM jm ORDER BY id;
UPDATE jm SET doc = '[1,{"k":"v"},[2,3]]' WHERE id = 1;
UPDATE jm SET doc = JSON_ARRAY(1, 2, 3) WHERE id = 2;
SELECT id, doc AS json_value FROM jm ORDER BY id;

REPLACE INTO jm (id, doc, label) VALUES (1, '{"a":{"b":1},"list":[1,2,3]}', 'object');
REPLACE INTO jm (id, doc, label) VALUES (3, '[true, null]', 'replaced');
INSERT IGNORE INTO jm (id, doc, label) VALUES (3, '{"ignored":true}', 'ignored');
INSERT INTO jm (id, doc, label) VALUES (5, '{"x":[]}', 'inserted') ON DUPLICATE KEY UPDATE doc = '{"x":[]}';
INSERT INTO jm (id, doc, label) VALUES (5, '{"x":[]}', 'inserted') ON DUPLICATE KEY UPDATE doc = '{"x":[1]}';
INSERT INTO jm (id, doc, label) VALUES (5, '{"x":[1]}', 'dup') ON DUPLICATE KEY UPDATE doc = '{"x":[1]}';
SELECT id, doc AS json_value, label FROM jm ORDER BY id;

CREATE TEMPORARY TABLE jm_copy (id INT PRIMARY KEY, doc JSON);
INSERT INTO jm_copy (id, doc) SELECT id, doc FROM jm ORDER BY id;
SELECT id, doc AS json_value FROM jm_copy ORDER BY id;
