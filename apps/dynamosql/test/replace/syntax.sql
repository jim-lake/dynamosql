CREATE DATABASE IF NOT EXISTS mem_gap_replace;
USE mem_gap_replace;
CREATE TEMPORARY TABLE r (id INT PRIMARY KEY, c VARCHAR(16));
CREATE TEMPORARY TABLE s (id INT PRIMARY KEY, c VARCHAR(16));
INSERT INTO r (id, c) VALUES (1, 'one'), (2, 'two');
INSERT INTO s (id, c) VALUES (2, 'dos'), (3, 'tres');

-- REPLACE with VALUES ROW(...)
REPLACE INTO r (id, c) VALUES ROW(1, 'uno'), ROW(4, 'cuatro');
SELECT id, c FROM r ORDER BY id;

-- REPLACE ... SELECT from another table
REPLACE INTO r (id, c) SELECT id, c FROM s;
SELECT id, c FROM r ORDER BY id;

-- REPLACE ... SELECT with constants and no FROM clause
REPLACE INTO r (id, c) SELECT 5, 'cinco';
SELECT id, c FROM r ORDER BY id;
