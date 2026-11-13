CREATE DATABASE IF NOT EXISTS mem_conv_char_err_db;
USE mem_conv_char_err_db;
CREATE TEMPORARY TABLE conv_char_err (id INT PRIMARY KEY, c CHAR(2), v VARCHAR(3));
INSERT INTO conv_char_err (id, c) VALUES (1, 'abc');
INSERT INTO conv_char_err (id, v) VALUES (2, 'abcd  ');
USE _dynamodb;
DROP DATABASE mem_conv_char_err_db;
