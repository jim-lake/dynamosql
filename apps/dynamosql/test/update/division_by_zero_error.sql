CREATE DATABASE IF NOT EXISTS dz_upd_test;
USE dz_upd_test;
CREATE TEMPORARY TABLE dz_upd (id INT PRIMARY KEY, c INT);
INSERT INTO dz_upd (id, c) VALUES (1, 1), (2, 2);
UPDATE dz_upd SET c = 1 / 0 WHERE id = 1;
UPDATE dz_upd SET c = c / 0 WHERE id = 2;
SELECT * FROM dz_upd ORDER BY id;
USE _dynamodb;
DROP DATABASE dz_upd_test;
