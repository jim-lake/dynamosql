SELECT 1 + 1 AS foo;
SELECT 1 = "1foo" AS foo;
SELECT 1 = "2foo" AS foo;
SELECT 1 != "2foo" AS foo;
SELECT 1 = "2foo" OR 0 = 0 AS foo;
SELECT 1 = null AS foo;
SELECT 1 OR null AS foo;
SELECT 1 AND null AS foo;
SELECT 0 AND null AS foo;
SELECT 0 OR null AS foo;

