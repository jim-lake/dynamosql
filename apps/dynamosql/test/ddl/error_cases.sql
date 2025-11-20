-- Test operations without database context (should error)
ALTER TABLE test ADD COLUMN col1 INT;
DELETE FROM test_table WHERE id = 1;
UPDATE test_table SET id = 1;
INSERT INTO test_table (id) VALUES (1);

-- DROP TABLE without database context
DROP TABLE test_table;
DROP TABLE test_table;
SHOW TABLES;

-- Test operations on nonexistent database
SELECT * FROM nonexistent_db.test_table;
INSERT INTO nonexistent_db.test_table (id) VALUES (1);
UPDATE nonexistent_db.test_table SET id = 1;
DELETE FROM nonexistent_db.test_table;
CREATE TABLE nonexistent_db.test_table (id INT PRIMARY KEY);
DROP TABLE nonexistent_db.test_table;
ALTER TABLE nonexistent_db.test_table ADD COLUMN col1 INT;

-- Test DROP nonexistent table without IF EXISTS
USE _dynamodb;
DROP TABLE nonexistent_table_xyz;
