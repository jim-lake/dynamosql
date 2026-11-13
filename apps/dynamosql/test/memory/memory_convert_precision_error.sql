CREATE DATABASE IF NOT EXISTS mem_conv_prec_err_db;
USE mem_conv_prec_err_db;
CREATE TEMPORARY TABLE conv_prec_err (id INT PRIMARY KEY, d DECIMAL(65,30), b BIGINT, bo BOOLEAN);
INSERT INTO conv_prec_err (id, d) VALUES (1, '1234567890123456789012345678901234567');
INSERT INTO conv_prec_err (id, b) VALUES (2, '9223372036854775808');
INSERT INTO conv_prec_err (id, b) VALUES (3, '-9223372036854775809');
INSERT INTO conv_prec_err (id, bo) VALUES (4, '-128.5');
USE _dynamodb;
DROP DATABASE mem_conv_prec_err_db;
