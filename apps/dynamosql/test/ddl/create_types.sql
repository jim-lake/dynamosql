CREATE DATABASE IF NOT EXISTS mem_gap_types;
USE mem_gap_types;

CREATE TEMPORARY TABLE big_unsigned (id INT PRIMARY KEY, d BIGINT UNSIGNED);
INSERT INTO big_unsigned (id, d) VALUES (1, 4);
SELECT id, d FROM big_unsigned;

CREATE TEMPORARY TABLE dt_types (id INT PRIMARY KEY, d DATE, t TIME(3), dt DATETIME(6));
INSERT INTO dt_types (id, d, t, dt) VALUES (1, '2024-02-29', '12:34:56.123', '2024-02-29 01:02:03.456789');
SELECT id, d, t, dt FROM dt_types;

CREATE TEMPORARY TABLE str_types (id INT PRIMARY KEY, c CHAR(3), vb VARBINARY(8), tb TINYBLOB, b BLOB, mb MEDIUMBLOB, lb LONGBLOB);
INSERT INTO str_types (id, c, vb, tb, b, mb, lb) VALUES (1, 'ab', 'xyz', 'tiny', 'blob', 'medium', 'long');
SELECT id, c, vb, tb, b, mb, lb FROM str_types;

CREATE TEMPORARY TABLE text_types (id INT PRIMARY KEY, tt TINYTEXT, t TEXT, mt MEDIUMTEXT, lt LONGTEXT);
INSERT INTO text_types (id, tt, t, mt, lt) VALUES (1, 'tiny', 'text', 'medium', 'long');
SELECT id, tt, t, mt, lt FROM text_types;
