CREATE DATABASE IF NOT EXISTS dst_dtypes;
DROP TEMPORARY TABLE IF EXISTS dst_dtypes.dst_fn_t;
CREATE TEMPORARY TABLE dst_dtypes.dst_fn_t (id INT PRIMARY KEY, s VARCHAR(20), c CHAR(5), dt DATETIME, d DATE) ENGINE=MEMORY;
INSERT INTO dst_dtypes.dst_fn_t VALUES (1, 'Abc', 'xy', '2024-01-01 10:00:00', '2024-01-01'), (2, 'abc', 'zz', '2024-01-02 11:30:00', '2024-01-02'), (3, NULL, NULL, NULL, NULL), (4, 'ÀB', 'q', '2024-02-29 23:59:59', '2024-02-29');

SELECT DISTINCT LCASE(s) AS c FROM dst_dtypes.dst_fn_t ORDER BY c;
SELECT DISTINCT UCASE(s) AS c FROM dst_dtypes.dst_fn_t ORDER BY c;
SELECT DISTINCT CHAR_LENGTH(s) AS c FROM dst_dtypes.dst_fn_t ORDER BY c;
SELECT DISTINCT CHARACTER_LENGTH(c) AS c FROM dst_dtypes.dst_fn_t ORDER BY c;
SELECT DISTINCT DATE(dt) AS c FROM dst_dtypes.dst_fn_t ORDER BY c;
SELECT DISTINCT TIME(dt) AS c FROM dst_dtypes.dst_fn_t ORDER BY c;
SELECT DISTINCT UNIX_TIMESTAMP(dt) AS c FROM dst_dtypes.dst_fn_t ORDER BY c;

DROP TEMPORARY TABLE IF EXISTS dst_dtypes.dst_fn_t;
