CREATE DATABASE IF NOT EXISTS dst_json_dtypes;
DROP TEMPORARY TABLE IF EXISTS dst_json_dtypes.dst_json_fn_t;
CREATE TEMPORARY TABLE dst_json_dtypes.dst_json_fn_t (id INT PRIMARY KEY, j JSON, s VARCHAR(20));
INSERT INTO dst_json_dtypes.dst_json_fn_t VALUES (1, '{"a":1}', 'x'), (2, '{"a":1}', 'x'), (3, '[1,2]', 'y'), (4, NULL, NULL);

SELECT DISTINCT JSON_SET(j, '$.a', s) AS json_value FROM dst_json_dtypes.dst_json_fn_t WHERE id IN (1, 2);
SELECT DISTINCT JSON_INSERT(j, '$.b', 2) AS json_value FROM dst_json_dtypes.dst_json_fn_t WHERE id IN (1, 2);
SELECT DISTINCT JSON_REPLACE(j, '$.a', 9) AS json_value FROM dst_json_dtypes.dst_json_fn_t WHERE id IN (1, 2);
SELECT DISTINCT JSON_REMOVE(j, '$.a') AS json_value FROM dst_json_dtypes.dst_json_fn_t WHERE id IN (1, 2);
SELECT DISTINCT JSON_ARRAY_APPEND(j, '$', 3) AS json_value FROM dst_json_dtypes.dst_json_fn_t WHERE id IN (3);
SELECT DISTINCT JSON_ARRAY_INSERT(j, '$[0]', 0) AS json_value FROM dst_json_dtypes.dst_json_fn_t WHERE id IN (3);
SELECT DISTINCT JSON_MERGE_PATCH(j, '{"c":3}') AS json_value FROM dst_json_dtypes.dst_json_fn_t WHERE id IN (1, 2);
SELECT DISTINCT JSON_MERGE_PRESERVE(j, '{"c":3}') AS json_value FROM dst_json_dtypes.dst_json_fn_t WHERE id IN (1, 2);
SELECT DISTINCT JSON_MERGE(j, '[4]') AS json_value FROM dst_json_dtypes.dst_json_fn_t WHERE id IN (3);
SELECT DISTINCT JSON_PRETTY(j) AS json_value FROM dst_json_dtypes.dst_json_fn_t WHERE id IN (1, 2);
SELECT DISTINCT JSON_SCHEMA_VALIDATION_REPORT('{"type":"object"}', j) AS json_value FROM dst_json_dtypes.dst_json_fn_t WHERE id IN (1, 2);

DROP TEMPORARY TABLE IF EXISTS dst_json_dtypes.dst_json_fn_t;
