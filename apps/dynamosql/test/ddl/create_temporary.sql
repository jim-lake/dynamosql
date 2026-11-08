CREATE DATABASE IF NOT EXISTS mem_gap_create;
USE mem_gap_create;

-- Column collation decides comparisons
CREATE TEMPORARY TABLE cs_col (id INT PRIMARY KEY, name VARCHAR(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin);
INSERT INTO cs_col (id, name) VALUES (1, 'Case');
SELECT id, name FROM cs_col ORDER BY id;
SELECT id FROM cs_col WHERE name = 'case' ORDER BY id;

-- Table character set and collation decide comparisons
CREATE TEMPORARY TABLE cs_tbl (id INT PRIMARY KEY, v VARCHAR(16)) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;
INSERT INTO cs_tbl (id, v) VALUES (1, 'Case');
SELECT id, v FROM cs_tbl ORDER BY id;
SELECT id FROM cs_tbl WHERE v = 'case' ORDER BY id;

-- Database collation is inherited by tables created in it
CREATE DATABASE mem_gap_charset CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;
USE mem_gap_charset;
CREATE TEMPORARY TABLE in_charset_db (id INT PRIMARY KEY, v VARCHAR(8));
INSERT INTO in_charset_db (id, v) VALUES (1, 'Case');
SELECT id, v FROM in_charset_db ORDER BY id;
SELECT id FROM in_charset_db WHERE v = 'case' ORDER BY id;
USE mem_gap_create;
DROP DATABASE mem_gap_charset;

-- Character set without a collation uses the charset default collation
CREATE TEMPORARY TABLE cs_only_col (id INT PRIMARY KEY, v VARCHAR(8) CHARACTER SET utf8mb4);
INSERT INTO cs_only_col (id, v) VALUES (1, 'Case');
SELECT id FROM cs_only_col WHERE v = 'case' ORDER BY id;

CREATE TEMPORARY TABLE cs_only_tbl (id INT PRIMARY KEY, v VARCHAR(8)) CHARACTER SET utf8mb4;
INSERT INTO cs_only_tbl (id, v) VALUES (1, 'Case');
SELECT id FROM cs_only_tbl WHERE v = 'case' ORDER BY id;

CREATE DATABASE mem_gap_charset_only CHARACTER SET utf8mb4;
USE mem_gap_charset_only;
CREATE TEMPORARY TABLE in_charset_only (id INT PRIMARY KEY, v VARCHAR(8));
INSERT INTO in_charset_only (id, v) VALUES (1, 'Case');
SELECT id FROM in_charset_only WHERE v = 'case' ORDER BY id;
USE mem_gap_create;
DROP DATABASE mem_gap_charset_only;

CREATE TEMPORARY TABLE co_only_tbl (id INT PRIMARY KEY, v VARCHAR(8)) COLLATE utf8mb4_bin;
INSERT INTO co_only_tbl (id, v) VALUES (1, 'Case');
SELECT id FROM co_only_tbl WHERE v = 'case' ORDER BY id;
