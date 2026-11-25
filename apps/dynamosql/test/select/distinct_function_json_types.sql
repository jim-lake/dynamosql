CREATE DATABASE IF NOT EXISTS dst_json_dtypes;
DROP TEMPORARY TABLE IF EXISTS dst_json_dtypes.dst_json_fn_t;
CREATE TEMPORARY TABLE dst_json_dtypes.dst_json_fn_t (id INT PRIMARY KEY, j JSON, s VARCHAR(20));
INSERT INTO dst_json_dtypes.dst_json_fn_t VALUES (1, '{\"a\":1}', 'x'), (2, '{\"a\":1}', 'x'), (3, '[1,2]', 'y'), (4, NULL, NULL), (5, '{\"a\":1,\"b\":2}', 'x'), (6, '{\"b\":2,\"a\":1}', 'x'), (7, '[1.0]', 'y'), (8, '[1]', 'y'), (9, 'null', 'z');

SELECT DISTINCT JSON_SET(j, '$.a', s) AS json_value FROM dst_json_dtypes.dst_json_fn_t WHERE id IN (1, 2);
SELECT DISTINCT JSON_INSERT(j, '$.b', 2) AS json_value FROM dst_json_dtypes.dst_json_fn_t WHERE id IN (1, 2);
SELECT DISTINCT JSON_REPLACE(j, '$.a', 9) AS json_value FROM dst_json_dtypes.dst_json_fn_t WHERE id IN (1, 2);
SELECT DISTINCT JSON_REMOVE(j, '$.a') AS json_value FROM dst_json_dtypes.dst_json_fn_t WHERE id IN (1, 2);
SELECT DISTINCT JSON_ARRAY_APPEND(j, '$', 3) AS json_value FROM dst_json_dtypes.dst_json_fn_t WHERE id IN (3);
SELECT DISTINCT JSON_ARRAY_INSERT(j, '$[0]', 0) AS json_value FROM dst_json_dtypes.dst_json_fn_t WHERE id IN (3);
SELECT DISTINCT JSON_MERGE_PATCH(j, '{\"c\":3}') AS json_value FROM dst_json_dtypes.dst_json_fn_t WHERE id IN (1, 2);
SELECT DISTINCT JSON_MERGE_PRESERVE(j, '{\"c\":3}') AS json_value FROM dst_json_dtypes.dst_json_fn_t WHERE id IN (1, 2);
SELECT DISTINCT JSON_MERGE(j, '[4]') AS json_value FROM dst_json_dtypes.dst_json_fn_t WHERE id IN (3);
SELECT DISTINCT JSON_PRETTY(j) AS json_value FROM dst_json_dtypes.dst_json_fn_t WHERE id IN (1, 2);
SELECT DISTINCT JSON_SCHEMA_VALIDATION_REPORT('{\"type\":\"object\"}', j) AS json_value FROM dst_json_dtypes.dst_json_fn_t WHERE id IN (1, 2);

SELECT DISTINCT JSON_VALUE(j, '$.a') AS result FROM dst_json_dtypes.dst_json_fn_t WHERE id IN (1, 2, 3, 4) ORDER BY result;
SELECT DISTINCT JSON_VALUE(j, '$.a' RETURNING UNSIGNED) AS result FROM dst_json_dtypes.dst_json_fn_t WHERE id IN (1, 2, 3, 4) ORDER BY result;
SELECT DISTINCT JSON_VALUE(j, '$.a' RETURNING DOUBLE) AS result FROM dst_json_dtypes.dst_json_fn_t WHERE id IN (1, 2, 3, 4) ORDER BY result;
SELECT DISTINCT JSON_VALUE(j, '$.a' RETURNING CHAR) AS result FROM dst_json_dtypes.dst_json_fn_t WHERE id IN (1, 2, 3, 4) ORDER BY result;
SELECT DISTINCT JSON_SEARCH('{\"a\":\"x\"}', 'one', s) AS result FROM dst_json_dtypes.dst_json_fn_t WHERE id IN (1, 2, 3, 4) ORDER BY result;
SELECT DISTINCT JSON_STORAGE_FREE(j) AS result FROM dst_json_dtypes.dst_json_fn_t WHERE id IN (1, 2, 3, 4) ORDER BY result;

SELECT DISTINCT JSON_ARRAY(s, s) AS json_value FROM dst_json_dtypes.dst_json_fn_t WHERE id IN (1, 2);
SELECT DISTINCT JSON_OBJECT('k', s) AS json_value FROM dst_json_dtypes.dst_json_fn_t WHERE id IN (1, 2);
SELECT DISTINCT JSON_OBJECT('k', s) AS json_value FROM dst_json_dtypes.dst_json_fn_t WHERE id = 4;

SELECT DISTINCT j -> '$.a' AS json_value FROM dst_json_dtypes.dst_json_fn_t WHERE id IN (1, 2);
SELECT DISTINCT j -> '$.a' AS json_value FROM dst_json_dtypes.dst_json_fn_t WHERE id IN (3, 4);
SELECT DISTINCT j ->> '$.a' AS result FROM dst_json_dtypes.dst_json_fn_t WHERE id IN (1, 2, 3, 4) ORDER BY result;

SELECT DISTINCT CAST(j AS JSON) AS json_value FROM dst_json_dtypes.dst_json_fn_t WHERE id IN (1, 2);
SELECT DISTINCT CAST(JSON_QUOTE(s) AS JSON) AS json_value, s FROM dst_json_dtypes.dst_json_fn_t WHERE id IN (1, 3, 4) ORDER BY s;

SELECT DISTINCT JSON_ARRAYAGG(s) AS json_value FROM dst_json_dtypes.dst_json_fn_t WHERE id IN (1, 2);
SELECT DISTINCT JSON_ARRAYAGG(j) AS json_value FROM dst_json_dtypes.dst_json_fn_t WHERE id IN (1, 2);
SELECT DISTINCT s AS result, JSON_ARRAYAGG(s) AS json_value FROM dst_json_dtypes.dst_json_fn_t WHERE id IN (1, 2, 3) GROUP BY s ORDER BY result;
SELECT DISTINCT s AS result, JSON_OBJECTAGG(s, s) AS json_value FROM dst_json_dtypes.dst_json_fn_t WHERE id IN (1, 2, 3) GROUP BY s ORDER BY result;

SELECT DISTINCT j AS json_value FROM dst_json_dtypes.dst_json_fn_t WHERE id IN (5, 6);
SELECT DISTINCT j AS json_value FROM dst_json_dtypes.dst_json_fn_t WHERE id IN (7, 8);
SELECT DISTINCT JSON_TYPE(j) AS result FROM dst_json_dtypes.dst_json_fn_t WHERE id IN (4, 9) ORDER BY result;
SELECT DISTINCT j AS json_value, s FROM dst_json_dtypes.dst_json_fn_t WHERE id IN (4, 9) ORDER BY s;

DROP TEMPORARY TABLE IF EXISTS dst_json_dtypes.dst_json_fn_t;
