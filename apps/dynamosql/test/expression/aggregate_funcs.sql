-- Test AVG function
SELECT AVG(5);
SELECT AVG(10.5);
SELECT AVG(NULL) AS result;

-- Test MIN function
SELECT MIN(5);
SELECT MIN('apple');
SELECT MIN(NULL) AS result;

-- Test MAX function
SELECT MAX(5);
SELECT MAX('zebra');
SELECT MAX(NULL) AS result;
