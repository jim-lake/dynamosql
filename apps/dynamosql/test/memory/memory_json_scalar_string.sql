CREATE DATABASE IF NOT EXISTS mem_json_sstr;
USE mem_json_sstr;

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
SELECT id, CONCAT(doc, '!') AS v FROM js WHERE id <= 12 ORDER BY id;
SELECT id, CONCAT_WS('-', doc, n) AS v FROM js WHERE id <= 5 ORDER BY id;
SELECT id, UPPER(doc) AS v FROM js WHERE id IN (5, 6, 12) ORDER BY id;
SELECT id, LOWER(doc) AS v FROM js WHERE id IN (3, 8, 9) ORDER BY id;
