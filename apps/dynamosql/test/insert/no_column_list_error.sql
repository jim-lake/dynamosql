CREATE DATABASE IF NOT EXISTS ins_nocol_err_test;
USE ins_nocol_err_test;
CREATE TEMPORARY TABLE ins_nocol_err (id INT PRIMARY KEY, val INT);
INSERT INTO ins_nocol_err VALUES (1);
INSERT INTO ins_nocol_err VALUES (1, 2, 3);
INSERT INTO ins_nocol_err VALUES (1, 1), (2);
SELECT * FROM ins_nocol_err ORDER BY id;
USE _dynamodb;
DROP DATABASE ins_nocol_err_test;
