CREATE DATABASE IF NOT EXISTS mem_conv_ignore_err_db;
USE mem_conv_ignore_err_db;
CREATE TEMPORARY TABLE conv_ign_err (id INT PRIMARY KEY, t TINYINT NOT NULL, v VARCHAR(2) NOT NULL);
INSERT INTO conv_ign_err (id, t, v) VALUES (1, 200, 'ok');
INSERT INTO conv_ign_err (id, t, v) VALUES (2, 1, 'abc');
INSERT INTO conv_ign_err (id, t, v) VALUES (3, NULL, 'ok');
USE _dynamodb;
DROP DATABASE mem_conv_ignore_err_db;
