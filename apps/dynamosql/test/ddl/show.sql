-- Create test databases
CREATE DATABASE IF NOT EXISTS test_db1;
CREATE DATABASE IF NOT EXISTS test_db2;

-- USE database
USE test_db1;
SELECT DATABASE() AS current_db;

USE test_db2;
SELECT DATABASE() AS current_db;

USE _dynamodb;
SELECT DATABASE() AS current_db;

-- Create and cleanup tables in test databases
CREATE TABLE IF NOT EXISTS test_db1.table1 (id INT PRIMARY KEY);
CREATE TABLE IF NOT EXISTS test_db2.table2 (id INT PRIMARY KEY);
DROP TABLE IF EXISTS test_db1.table1;
DROP TABLE IF EXISTS test_db2.table2;
DROP DATABASE IF EXISTS test_db1;
DROP DATABASE IF EXISTS test_db2;

USE _dynamodb;
SELECT DATABASE() AS current_db;
