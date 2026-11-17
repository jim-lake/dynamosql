-- Test LIKE with a column or expression on the right side
CREATE DATABASE IF NOT EXISTS like_column;
CREATE TEMPORARY TABLE like_column.test_like (id INT PRIMARY KEY, val VARCHAR(20), pat VARCHAR(20));
INSERT INTO like_column.test_like (id, val, pat) VALUES (1, 'abc', 'a%'), (2, 'abc', 'x%'), (3, NULL, 'a%'), (4, 'abc', NULL), (5, 'ABC', 'abc'), (6, 'abc', 'a_c'), (7, 'abcd', 'a%'), (8, 'abc', CONCAT('a', '%'));

-- Literal value with a column pattern
SELECT id, 'abc' LIKE pat AS result FROM like_column.test_like ORDER BY id;
SELECT id, 'ABC' LIKE pat AS result FROM like_column.test_like ORDER BY id;
SELECT id, NULL LIKE pat AS result FROM like_column.test_like ORDER BY id;

-- Column value with a literal pattern
SELECT id, val LIKE 'a%' AS result FROM like_column.test_like ORDER BY id;
SELECT id, val LIKE 'abc' AS result FROM like_column.test_like ORDER BY id;

-- Column value with a column pattern
SELECT id, val LIKE pat AS result FROM like_column.test_like ORDER BY id;
SELECT id, val NOT LIKE pat AS result FROM like_column.test_like ORDER BY id;
SELECT id, val LIKE pat AS result FROM like_column.test_like WHERE val LIKE pat ORDER BY id;
SELECT id, val FROM like_column.test_like WHERE val NOT LIKE pat ORDER BY id;

-- Expression pattern
SELECT 'abc' LIKE CONCAT('a', '%') AS result;
SELECT 'abc' NOT LIKE CONCAT('a', '%') AS result;
SELECT id, val FROM like_column.test_like WHERE val LIKE CONCAT(pat, '') ORDER BY id;
SELECT id, val LIKE CONCAT('a', '%') AS result FROM like_column.test_like ORDER BY id;

-- NULL value or pattern
SELECT 'abc' LIKE NULL AS result;
SELECT NULL LIKE 'a%' AS result;
SELECT NULL NOT LIKE 'a%' AS result;
SELECT id, val LIKE NULL AS result FROM like_column.test_like ORDER BY id;
