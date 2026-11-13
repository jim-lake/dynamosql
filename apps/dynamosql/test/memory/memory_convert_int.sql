CREATE DATABASE IF NOT EXISTS mem_conv_int_db;
USE mem_conv_int_db;
CREATE TEMPORARY TABLE conv_int (
  id INT PRIMARY KEY,
  t TINYINT, s SMALLINT, m MEDIUMINT, i INT, b BIGINT, bo BOOLEAN
);
INSERT INTO conv_int (id, t, s, m, i, b, bo) VALUES (1, 127, 32767, 8388607, 2147483647, 9223372036854775807, TRUE);
INSERT INTO conv_int (id, t, s, m, i, b, bo) VALUES (2, -128, -32768, -8388608, -2147483648, -9007199254740991, FALSE);
INSERT INTO conv_int (id, t, s, m, i, b, bo) VALUES (3, '127', '32767', '8388607', '2147483647', '9223372036854775807', '1');
INSERT INTO conv_int (id, t, s, m, i, b, bo) VALUES (4, '  12  ', ' -5 ', '0', '+42', '  77', '0');
INSERT INTO conv_int (id, t, s, m, i, b, bo) VALUES (5, 1.5, 2.5, -2.5, 3.5, -3.5, 2);
INSERT INTO conv_int (id, t, s, m, i, b, bo) VALUES (6, '1.5', '2.5', '-2.5', '3.5', '-3.5', '2');
INSERT INTO conv_int (id, t, s, m, i, b, bo) VALUES (7, '1e2', '1e2', '1E1', '2e0', '5e2', '1e0');
INSERT INTO conv_int (id, t, s, m, i, b, bo) VALUES (8, '0.9999', '99.5', '-0.5', '1.0', '2.00', '0.4');
INSERT INTO conv_int (id, t, s, m, i, b, bo) VALUES (9, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO conv_int (id, t, s, m, i, b, bo) VALUES (10, 0, 0, 0, 0, 0, 0);
SELECT id, t, s, m, i, b, bo FROM conv_int ORDER BY id;
SELECT id, t + 1, s * 2, i - 1, b / 2 FROM conv_int WHERE id <= 8 ORDER BY id;
SELECT id, bo, bo = 1, bo = 0 FROM conv_int ORDER BY id;
USE _dynamodb;
DROP DATABASE mem_conv_int_db;
