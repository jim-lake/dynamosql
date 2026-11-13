CREATE DATABASE IF NOT EXISTS mem_conv_str_err_db;
USE mem_conv_str_err_db;
CREATE TEMPORARY TABLE conv_str_err (id INT PRIMARY KEY, v VARCHAR(3), c CHAR(2));
INSERT INTO conv_str_err (id, v) VALUES (1, 'abcd');
INSERT INTO conv_str_err (id, c) VALUES (2, 'xyz');
USE _dynamodb;
DROP DATABASE mem_conv_str_err_db;
