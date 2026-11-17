-- Test SUBSTRING_INDEX() with positive, negative and zero counts
SELECT SUBSTRING_INDEX('www.mysql.com', '.', 1) AS result;
SELECT SUBSTRING_INDEX('www.mysql.com', '.', 2) AS result;
SELECT SUBSTRING_INDEX('www.mysql.com', '.', 3) AS result;
SELECT SUBSTRING_INDEX('www.mysql.com', '.', 100) AS result;
SELECT SUBSTRING_INDEX('www.mysql.com', '.', -1) AS result;
SELECT SUBSTRING_INDEX('www.mysql.com', '.', -2) AS result;
SELECT SUBSTRING_INDEX('www.mysql.com', '.', -3) AS result;
SELECT SUBSTRING_INDEX('www.mysql.com', '.', -100) AS result;
SELECT SUBSTRING_INDEX('www.mysql.com', '.', 0) AS result;
SELECT SUBSTRING_INDEX('www.mysql.com', '.', -0) AS result;

-- Test SUBSTRING_INDEX() with a delimiter that is not found
SELECT SUBSTRING_INDEX('www.mysql.com', 'xx', 1) AS result;
SELECT SUBSTRING_INDEX('www.mysql.com', 'xx', -1) AS result;

-- Test SUBSTRING_INDEX() with an empty delimiter
SELECT SUBSTRING_INDEX('www.mysql.com', '', 1) AS result;
SELECT SUBSTRING_INDEX('www.mysql.com', '', -1) AS result;

-- Test SUBSTRING_INDEX() with an empty string
SELECT SUBSTRING_INDEX('', '.', 1) AS result;
SELECT SUBSTRING_INDEX('', '.', -1) AS result;

-- Test SUBSTRING_INDEX() with multi-character delimiters
SELECT SUBSTRING_INDEX('a::b::c', '::', 1) AS result;
SELECT SUBSTRING_INDEX('a::b::c', '::', 2) AS result;
SELECT SUBSTRING_INDEX('a::b::c', '::', -1) AS result;
SELECT SUBSTRING_INDEX('a::b::c', '::', -2) AS result;
SELECT SUBSTRING_INDEX('a.b.c', ' .', 1) AS result;

-- Test SUBSTRING_INDEX() with overlapping delimiter occurrences
SELECT SUBSTRING_INDEX('aaaaa', 'aa', -2) AS result;
SELECT SUBSTRING_INDEX('aaaaa', 'aa', 2) AS result;
SELECT SUBSTRING_INDEX('aaaaaaaa', 'aa', -3) AS result;
SELECT SUBSTRING_INDEX('aaaaaaaa', 'aa', -5) AS result;
SELECT SUBSTRING_INDEX('xabababx', 'aba', -1) AS result;
SELECT SUBSTRING_INDEX('xabababx', 'aba', -2) AS result;
SELECT SUBSTRING_INDEX('abababa', 'aba', 2) AS result;
SELECT SUBSTRING_INDEX('aaaaaaa', 'aaa', -2) AS result;

-- Test SUBSTRING_INDEX() is case sensitive
SELECT SUBSTRING_INDEX('WWW.mysql.com', 'w', 1) AS result;
SELECT SUBSTRING_INDEX('www.mysql.com', 'W', 1) AS result;

-- Test SUBSTRING_INDEX() with multi-byte characters
SELECT SUBSTRING_INDEX('héllo→wörld→x', '→', 1) AS result;
SELECT SUBSTRING_INDEX('héllo→wörld→x', '→', -1) AS result;
SELECT SUBSTRING_INDEX('ééé', 'é', -1) AS result;
SELECT SUBSTRING_INDEX('😀a😀b', '😀', 2) AS result;

-- Test SUBSTRING_INDEX() with NULL arguments
SELECT SUBSTRING_INDEX(NULL, '.', 1) AS result;
SELECT SUBSTRING_INDEX('a.b', NULL, 1) AS result;
SELECT SUBSTRING_INDEX('a.b', '.', NULL) AS result;
SELECT SUBSTRING_INDEX(NULL, '.', 0) AS result;
SELECT SUBSTRING_INDEX('a.b.c', NULL, 0) AS result;

-- Test SUBSTRING_INDEX() with non-string arguments
SELECT SUBSTRING_INDEX(12345, 3, 1) AS result;
SELECT SUBSTRING_INDEX(1e3, '.', 1) AS result;
SELECT SUBSTRING_INDEX('a.b.c', '.', '2') AS result;
SELECT SUBSTRING_INDEX('a.b.c', '.', 1.4) AS result;
SELECT SUBSTRING_INDEX('a.b.c', '.', 1.5) AS result;
SELECT SUBSTRING_INDEX('a.b.c', '.', 'x') AS result;
SELECT SUBSTRING_INDEX(CAST(1.50 AS DECIMAL(5,2)), '.', 1) AS result;
SELECT SUBSTRING_INDEX(CAST(1.50 AS DECIMAL(5,2)), '.', -1) AS result;
SELECT SUBSTRING_INDEX(CAST('2020-01-02' AS DATE), '-', 1) AS result;
SELECT SUBSTRING_INDEX(CAST('2020-01-02 03:04:05' AS DATETIME), ' ', -1) AS result;
SELECT SUBSTRING_INDEX(CAST('10:20:30' AS TIME), ':', 2) AS result;

-- Test SUBSTRING_INDEX() with column arguments
CREATE DATABASE IF NOT EXISTS fn_substring_index;
CREATE TEMPORARY TABLE fn_substring_index.test_paths (id INT PRIMARY KEY, path VARCHAR(100), delim VARCHAR(10), cnt INT);
INSERT INTO fn_substring_index.test_paths (id, path, delim, cnt) VALUES (1, 'a/b/c', '/', 1), (2, 'a/b/c', '/', -1), (3, 'a/b/c', '/', 0), (4, 'a/b/c', '//', 1), (5, NULL, '/', 1), (6, 'a/b/c', NULL, 1), (7, 'a/b/c', '/', NULL), (8, 'x.y', '.', 5);
SELECT id, SUBSTRING_INDEX(path, delim, cnt) AS result FROM fn_substring_index.test_paths ORDER BY id;
SELECT id, SUBSTRING_INDEX(path, '/', cnt) AS result FROM fn_substring_index.test_paths ORDER BY id;
SELECT id, SUBSTRING_INDEX('a/b/c', delim, cnt) AS result FROM fn_substring_index.test_paths ORDER BY id;
