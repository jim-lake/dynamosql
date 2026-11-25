CREATE DATABASE IF NOT EXISTS dst_json_coalesce;
DROP TEMPORARY TABLE IF EXISTS dst_json_coalesce.dst_json_co_t;
CREATE TEMPORARY TABLE dst_json_coalesce.dst_json_co_t (id INT PRIMARY KEY, j JSON, s VARCHAR(20));
INSERT INTO dst_json_coalesce.dst_json_co_t VALUES (1, '{"a":1}', 'x'), (2, '{"a":1}', 'x'), (3, '[1,2]', 'y'), (4, NULL, NULL);

SELECT DISTINCT COALESCE(j, '[]') AS json_value FROM dst_json_coalesce.dst_json_co_t WHERE id IN (1, 2, 4);
SELECT DISTINCT COALESCE(j, j) AS json_value FROM dst_json_coalesce.dst_json_co_t WHERE id IN (1, 2, 4);
SELECT DISTINCT COALESCE(j, NULL) AS json_value FROM dst_json_coalesce.dst_json_co_t WHERE id IN (1, 2, 4);
SELECT DISTINCT COALESCE(j, s) AS json_value FROM dst_json_coalesce.dst_json_co_t WHERE id IN (1, 2, 4);
SELECT DISTINCT IFNULL(j, '[]') AS json_value FROM dst_json_coalesce.dst_json_co_t WHERE id IN (1, 2, 4);
SELECT DISTINCT IFNULL(j, j) AS json_value FROM dst_json_coalesce.dst_json_co_t WHERE id IN (1, 2, 4);
SELECT DISTINCT IF(1, j, '[]') AS json_value FROM dst_json_coalesce.dst_json_co_t WHERE id IN (1, 2);
SELECT DISTINCT IF(0, j, j) AS json_value FROM dst_json_coalesce.dst_json_co_t WHERE id IN (1, 2);
SELECT DISTINCT IF(id = 3, j, s) AS json_value FROM dst_json_coalesce.dst_json_co_t WHERE id IN (1, 3);
SELECT DISTINCT GREATEST(j, '[]') AS json_value FROM dst_json_coalesce.dst_json_co_t WHERE id IN (1, 2);

SELECT COALESCE(CAST('[1]' AS JSON), '[]') AS a, JSON_TYPE(COALESCE(CAST('[1]' AS JSON), '[]')) AS t;
SELECT COALESCE(CAST('[1]' AS JSON), CAST('[2]' AS JSON)) AS a, JSON_TYPE(COALESCE(CAST('[1]' AS JSON), CAST('[2]' AS JSON))) AS t;
SELECT COALESCE(CAST('[1]' AS JSON), NULL) AS a, JSON_TYPE(COALESCE(CAST('[1]' AS JSON), NULL)) AS t;
SELECT IFNULL(NULL, CAST('[1]' AS JSON)) AS a, JSON_TYPE(IFNULL(NULL, CAST('[1]' AS JSON))) AS t;
SELECT IF(1, CAST('[1]' AS JSON), '[]') AS a, JSON_TYPE(IF(1, CAST('[1]' AS JSON), '[]')) AS t;
SELECT IF(0, CAST('[1]' AS JSON), '[]') AS a;
SELECT IF(1, CAST('[1]' AS JSON), CAST('{"a":1}' AS JSON)) AS a, JSON_TYPE(IF(1, CAST('[1]' AS JSON), CAST('{"a":1}' AS JSON))) AS t;
SELECT GREATEST(CAST('[1]' AS JSON), CAST('[2]' AS JSON)) AS a;
SELECT LEAST(CAST('[1]' AS JSON), CAST('[2]' AS JSON)) AS a;
SELECT GREATEST(CAST('[1]' AS JSON), '[2]') AS a;
SELECT GREATEST(CAST('[1]' AS JSON), 1) AS a;
SELECT LEAST(CAST('[1]' AS JSON), 2) AS a;
SELECT COALESCE(CAST('[1]' AS JSON), 1) AS a;

DROP TEMPORARY TABLE IF EXISTS dst_json_coalesce.dst_json_co_t;
