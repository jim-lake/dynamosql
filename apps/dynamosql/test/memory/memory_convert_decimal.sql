CREATE DATABASE IF NOT EXISTS mem_conv_dec_db;
USE mem_conv_dec_db;
CREATE TEMPORARY TABLE conv_dec (
  id INT PRIMARY KEY,
  d1 DECIMAL(5,2), d2 DECIMAL(10), d3 NUMERIC(6,3), d4 DECIMAL(4,0), d5 DECIMAL
);
INSERT INTO conv_dec (id, d1, d2, d3, d4, d5) VALUES (1, 123.45, 1234567890, 123.456, 9999, 12345678);
INSERT INTO conv_dec (id, d1, d2, d3, d4, d5) VALUES (2, '-999.99', '-1', '-0.001', '-1234', '-2');
INSERT INTO conv_dec (id, d1, d2, d3, d4, d5) VALUES (3, 1.005, 2.5, 2.0005, 3.5, 4.5);
INSERT INTO conv_dec (id, d1, d2, d3, d4, d5) VALUES (4, '1.005', '2.5', '2.0005', '3.5', '4.5');
INSERT INTO conv_dec (id, d1, d2, d3, d4, d5) VALUES (5, '  7.5  ', '1e3', '1e-2', '2E1', '5e0');
INSERT INTO conv_dec (id, d1, d2, d3, d4, d5) VALUES (6, 0, 0, 0, 0, 0);
INSERT INTO conv_dec (id, d1, d2, d3, d4, d5) VALUES (7, NULL, NULL, NULL, NULL, NULL);
SELECT id, d1, d2, d3, d4, d5 FROM conv_dec ORDER BY id;
SELECT id, d1 + 0.1, d3 * 2 FROM conv_dec WHERE id <= 6 ORDER BY id;
USE _dynamodb;
DROP DATABASE mem_conv_dec_db;
