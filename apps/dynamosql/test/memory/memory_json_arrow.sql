-- JSON -> and ->> operators on column references
CREATE DATABASE IF NOT EXISTS mem_arrow_test;
USE mem_arrow_test;

CREATE TEMPORARY TABLE arrow_doc (id INT PRIMARY KEY, doc JSON, txt VARCHAR(256));
INSERT INTO arrow_doc (id, doc, txt) VALUES (1, '{"a":1}', '{"a":"x"}');
INSERT INTO arrow_doc (id, doc, txt) VALUES (2, '{"a":null,"b":[1,"s"]}', NULL);
INSERT INTO arrow_doc (id, doc, txt) VALUES (3, '[1,2,3]', '[1,2]');
INSERT INTO arrow_doc (id, doc, txt) VALUES (4, '{"a":{"b":[1,2]}}', '"x"');
INSERT INTO arrow_doc (id, doc, txt) VALUES (5, NULL, NULL);
INSERT INTO arrow_doc (id, doc, txt) VALUES (6, '{"a":1.50,"c":true,"d":"é"}', '{"a":1}');

SELECT doc -> '$.a' AS json_value FROM arrow_doc ORDER BY id;
SELECT doc -> '$.b' AS json_value FROM arrow_doc ORDER BY id;
SELECT doc ->> '$.a' AS json_value FROM arrow_doc ORDER BY id;
SELECT doc ->> '$.b[1]' AS text_value FROM arrow_doc ORDER BY id;
SELECT doc -> '$.a.b[1]' AS json_value FROM arrow_doc ORDER BY id;
SELECT doc ->> '$[last]' AS json_value FROM arrow_doc ORDER BY id;
SELECT doc ->> '$[last-1]' AS text_value FROM arrow_doc ORDER BY id;
SELECT doc -> '$[1]' AS json_value FROM arrow_doc ORDER BY id;
SELECT doc ->> '$.c' AS text_value FROM arrow_doc ORDER BY id;
SELECT doc ->> '$.d' AS text_value FROM arrow_doc ORDER BY id;
SELECT doc ->> '$.a' + 1 AS text_value FROM arrow_doc ORDER BY id;
SELECT doc ->> '$.a' IS NULL AS text_value FROM arrow_doc ORDER BY id;
SELECT id FROM arrow_doc WHERE doc ->> '$.a' = '1' ORDER BY id;
SELECT txt -> '$.a' AS json_value FROM arrow_doc ORDER BY id;
SELECT txt ->> '$.a' AS text_value FROM arrow_doc ORDER BY id;
INSERT INTO arrow_doc (id, doc, txt) VALUES (7, NULL, '{"a":1');
