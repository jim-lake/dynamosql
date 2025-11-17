-- Test DROP TABLE IF EXISTS on existing table
CREATE TABLE _dynamodb.drop_test (id INT PRIMARY KEY);
INSERT INTO _dynamodb.drop_test (id) VALUES (1);
SELECT * FROM _dynamodb.drop_test ORDER BY id;
DROP TABLE IF EXISTS _dynamodb.drop_test;

-- Test DROP TABLE IF EXISTS on non-existent table (should not error)
DROP TABLE IF EXISTS _dynamodb.nonexistent_table;

-- Test DROP TABLE on non-existent table (should error but we skip it)
-- DROP TABLE _dynamodb.nonexistent_table;

-- Test DROP DATABASE IF NOT EXISTS
CREATE DATABASE IF NOT EXISTS drop_db_test;
USE drop_db_test;
CREATE TEMPORARY TABLE test_table (id INT PRIMARY KEY);
INSERT INTO test_table (id) VALUES (1);
SELECT * FROM test_table ORDER BY id;
USE _dynamodb;
DROP DATABASE drop_db_test;

-- Test DROP DATABASE on non-existent database (should error but we skip it)
-- DROP DATABASE nonexistent_db;
