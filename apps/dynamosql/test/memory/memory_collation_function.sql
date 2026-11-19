CREATE DATABASE IF NOT EXISTS mem_coll_fn_db;
USE mem_coll_fn_db;
CREATE TEMPORARY TABLE coll_fn_t (
  id INT PRIMARY KEY,
  ai_col VARCHAR(20) COLLATE utf8mb4_0900_ai_ci,
  cs_col VARCHAR(20) COLLATE utf8mb4_0900_as_cs,
  bin_col VARCHAR(20) COLLATE utf8mb4_0900_bin,
  num_col INT,
  json_col JSON
);
INSERT INTO coll_fn_t VALUES (1, 'abc', 'abc', 'abc', 5, '{"a": 1}');
SELECT COLLATION(ai_col) AS result FROM coll_fn_t;
SELECT COLLATION(cs_col) AS result FROM coll_fn_t;
SELECT COLLATION(bin_col) AS result FROM coll_fn_t;
SELECT COLLATION(num_col) AS result FROM coll_fn_t;
SELECT COLLATION(ai_col + 1) AS result FROM coll_fn_t;
SELECT COLLATION(CONCAT(ai_col, 'x')) AS result FROM coll_fn_t;
SELECT COLLATION(CONCAT(cs_col, 'x')) AS result FROM coll_fn_t;
SELECT COLLATION(CONCAT(bin_col, 'x')) AS result FROM coll_fn_t;
SELECT COLLATION(CONCAT(ai_col, cs_col)) AS result FROM coll_fn_t;
SELECT COLLATION(UPPER(cs_col)) AS result FROM coll_fn_t;
SELECT COLLATION(SUBSTRING(bin_col, 1, 2)) AS result FROM coll_fn_t;
SELECT COLLATION(LENGTH(ai_col)) AS result FROM coll_fn_t;
SELECT COLLATION(LOCATE('b', ai_col)) AS result FROM coll_fn_t;
SELECT COLLATION(ai_col COLLATE utf8mb4_bin) AS result FROM coll_fn_t;
SELECT COLLATION(IF(id = 1, ai_col, cs_col)) AS result FROM coll_fn_t;
SELECT COLLATION(IFNULL(ai_col, 'x')) AS result FROM coll_fn_t;
SELECT COLLATION(COALESCE(bin_col, 'x')) AS result FROM coll_fn_t;
SELECT COLLATION(CASE WHEN id = 1 THEN ai_col ELSE cs_col END) AS result FROM coll_fn_t;
SELECT COLLATION(MIN(ai_col)) AS result FROM coll_fn_t;
SELECT COLLATION(MAX(bin_col)) AS result FROM coll_fn_t;
SELECT COLLATION(COUNT(ai_col)) AS result FROM coll_fn_t;
SELECT COLLATION(JSON_UNQUOTE(json_col)) AS result FROM coll_fn_t;
SELECT COLLATION(ai_col = 'ABC') AS result FROM coll_fn_t;
SELECT COLLATION(cs_col = 'ABC') AS result FROM coll_fn_t;
SELECT COLLATION(MD5(ai_col)) AS result FROM coll_fn_t;
SELECT COLLATION(HEX(bin_col)) AS result FROM coll_fn_t;
SELECT COLLATION(CAST(num_col AS CHAR)) AS result FROM coll_fn_t;
SELECT COLLATION(CAST(ai_col AS CHAR)) AS result FROM coll_fn_t;
SELECT COLLATION(CAST(num_col AS DECIMAL(10,2))) AS result FROM coll_fn_t;
SELECT COLLATION(ai_col) AS result FROM coll_fn_t WHERE id = 99;
SELECT COLLATION(ai_col) AS result FROM coll_fn_t WHERE id = 1 AND cs_col = 'abc';
SELECT COLLATION(cs_col) AS result FROM coll_fn_t WHERE id = 1 AND cs_col = 'abc';
USE _dynamodb;
DROP DATABASE mem_coll_fn_db;
