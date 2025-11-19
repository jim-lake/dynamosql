-- CREATE DATABASE
CREATE DATABASE IF NOT EXISTS test_create_db;
CREATE DATABASE IF NOT EXISTS test_create_db;
DROP DATABASE test_create_db;

-- Create table with single column
DROP TABLE IF EXISTS _dynamodb.test123;
CREATE TABLE _dynamodb.test123 (id INT PRIMARY KEY);
INSERT INTO _dynamodb.test123 (id) VALUES (1);
SELECT * FROM _dynamodb.test123;
DROP TABLE _dynamodb.test123;

-- Create table with composite primary key
DROP TABLE IF EXISTS _dynamodb.test1234;
CREATE TABLE _dynamodb.test1234 (key1 INT, key2 INT, other INT, PRIMARY KEY (key1, key2));
INSERT INTO _dynamodb.test1234 (key1, key2, other) VALUES (1, 2, 100);
SELECT * FROM _dynamodb.test1234;
DROP TABLE _dynamodb.test1234;

-- CREATE TABLE IF NOT EXISTS
DROP TABLE IF EXISTS _dynamodb.test123;
CREATE TABLE IF NOT EXISTS _dynamodb.test123 (id INT PRIMARY KEY);
CREATE TABLE IF NOT EXISTS _dynamodb.test123 (id INT PRIMARY KEY);
DROP TABLE _dynamodb.test123;
