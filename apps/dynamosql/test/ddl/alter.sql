-- Setup: create test table
DROP TABLE IF EXISTS _dynamodb.alter_test;
CREATE TABLE _dynamodb.alter_test (id INT PRIMARY KEY, name VARCHAR(256));
INSERT INTO _dynamodb.alter_test (id, name) VALUES (1, "test1"), (2, "test2");
SELECT * FROM _dynamodb.alter_test ORDER BY id;

-- ALTER TABLE ADD COLUMN
ALTER TABLE _dynamodb.alter_test ADD COLUMN age INT;

-- Insert with new column
INSERT INTO _dynamodb.alter_test (id, name, age) VALUES (3, "test3", 30);
SELECT * FROM _dynamodb.alter_test ORDER BY id;

-- ALTER TABLE ADD another COLUMN
ALTER TABLE _dynamodb.alter_test ADD COLUMN email VARCHAR(256);

-- Update with new columns
UPDATE _dynamodb.alter_test SET age = 25, email = "test1@example.com" WHERE id = 1;
UPDATE _dynamodb.alter_test SET age = 35, email = "test2@example.com" WHERE id = 2;
SELECT * FROM _dynamodb.alter_test ORDER BY id;

-- Cleanup
DROP TABLE IF EXISTS _dynamodb.alter_test;
