-- Test SUM function with integers
SELECT SUM(5) AS result;
SELECT SUM(10) AS result;
SELECT SUM(-5) AS result;
SELECT SUM(0) AS result;

-- Test SUM function with floats
SELECT SUM(5.5) AS result;
SELECT SUM(10.25) AS result;
SELECT SUM(-3.75) AS result;

-- Test SUM function with strings (should convert)
SELECT SUM('5') AS result;
SELECT SUM('10.5') AS result;

-- Test SUM with NULL
SELECT SUM(NULL) AS result;

-- Test AVG function with integers
SELECT AVG(5) AS result;
SELECT AVG(10) AS result;
SELECT AVG(-5) AS result;

-- Test AVG function with floats
SELECT AVG(10.5) AS result;
SELECT AVG(3.14) AS result;
SELECT AVG(-2.5) AS result;

-- Test AVG function with strings (should convert)
SELECT AVG('5') AS result;
SELECT AVG('10.5') AS result;

-- Test AVG with NULL
SELECT AVG(NULL) AS result;

-- Test MIN function with integers
SELECT MIN(5) AS result;
SELECT MIN(100) AS result;
SELECT MIN(-50) AS result;

-- Test MIN function with floats
SELECT MIN(5.5) AS result;
SELECT MIN(10.25) AS result;
SELECT MIN(-3.75) AS result;

-- Test MIN function with strings
SELECT MIN('apple') AS result;
SELECT MIN('zebra') AS result;
SELECT MIN('banana') AS result;

-- Test MIN with NULL
SELECT MIN(NULL) AS result;

-- Test MAX function with integers
SELECT MAX(5) AS result;
SELECT MAX(100) AS result;
SELECT MAX(-50) AS result;

-- Test MAX function with floats
SELECT MAX(5.5) AS result;
SELECT MAX(10.25) AS result;
SELECT MAX(-3.75) AS result;

-- Test MAX function with strings
SELECT MAX('apple') AS result;
SELECT MAX('zebra') AS result;
SELECT MAX('banana') AS result;

-- Test MAX with NULL
SELECT MAX(NULL) AS result;

-- Test COUNT function
SELECT COUNT(5) AS result;
SELECT COUNT('test') AS result;
SELECT COUNT(NULL) AS result;
