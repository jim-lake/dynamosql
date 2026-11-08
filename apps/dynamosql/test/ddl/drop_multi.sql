CREATE DATABASE IF NOT EXISTS mem_gap_drop;
USE mem_gap_drop;
CREATE TEMPORARY TABLE d1 (id INT PRIMARY KEY);
INSERT INTO d1 (id) VALUES (1);
SELECT id FROM d1 ORDER BY id;
DROP TABLE d1;

-- Dropped tables can be created again
CREATE TEMPORARY TABLE d1 (id INT PRIMARY KEY);
DROP TABLE d1;

CREATE DATABASE mem_gap_drop_schema;
DROP SCHEMA mem_gap_drop_schema;
CREATE DATABASE mem_gap_drop_schema;
DROP SCHEMA mem_gap_drop_schema;
