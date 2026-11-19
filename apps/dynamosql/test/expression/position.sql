-- POSITION(needle IN haystack) basics
SELECT POSITION('bar' IN 'foobarbar') AS result;
SELECT POSITION('xbar' IN 'foobar') AS result;
SELECT POSITION('' IN 'abc') AS result;
SELECT POSITION('' IN '') AS result;
SELECT POSITION('abc' IN 'abc') AS result;
SELECT POSITION('abcd' IN 'abc') AS result;
SELECT POSITION('b' IN 'abcb') AS result;
SELECT POSITION(NULL IN 'abc') AS result;
SELECT POSITION('b' IN NULL) AS result;
SELECT POSITION(NULL IN NULL) AS result;
SELECT POSITION(12 IN 3412) AS result;
SELECT POSITION(2 IN 1234.5) AS result;
SELECT POSITION('b' IN CONCAT('a', 'b', 'c')) AS result;
SELECT POSITION('lo' IN UPPER('hello')) AS result;
SELECT POSITION(' ' IN 'a b') AS result;
SELECT POSITION('b ' IN 'ab') AS result;

-- POSITION counts characters, not bytes or UTF-16 units
SELECT POSITION('b' IN 'ab😀b') AS result;
SELECT POSITION('😀' IN 'ab😀b') AS result;
SELECT POSITION('c' IN 'éàc') AS result;
SELECT POSITION('é' IN 'cafétéria') AS result;

-- POSITION uses the haystack collation
SELECT POSITION('B' IN 'abc') AS result;
SELECT POSITION('B' IN 'abc' COLLATE utf8mb4_0900_ai_ci) AS result;
SELECT POSITION('B' IN 'abc' COLLATE utf8mb4_0900_as_cs) AS result;
SELECT POSITION('B' IN 'abc' COLLATE utf8mb4_bin) AS result;
SELECT POSITION('b' COLLATE utf8mb4_bin IN 'ABC') AS result;
SELECT POSITION('b' COLLATE utf8mb4_0900_as_cs IN 'ABC' COLLATE utf8mb4_0900_ai_ci) AS result;
SELECT POSITION('B' COLLATE utf8mb4_0900_ai_ci IN 'abc' COLLATE utf8mb4_bin) AS result;
SELECT POSITION('é' IN 'cafe') AS result;
SELECT POSITION('e' IN 'café' COLLATE utf8mb4_0900_ai_ci) AS result;
SELECT POSITION('É' IN 'café' COLLATE utf8mb4_0900_ai_ci) AS result;

-- POSITION result collation
SELECT COLLATION(POSITION('b' IN 'abc')) AS result;
SELECT COLLATION(POSITION('b' IN 'abc' COLLATE utf8mb4_bin)) AS result;

-- LOCATE with start position
SELECT LOCATE('b', 'abc', 0) AS result;
SELECT LOCATE('b', 'abc', -1) AS result;
SELECT LOCATE('b', 'abc', 2) AS result;
SELECT LOCATE('b', 'abc', 3) AS result;
SELECT LOCATE('b', 'abb', 3) AS result;
SELECT LOCATE('b', 'abc', NULL) AS result;
SELECT LOCATE('', 'abc', 4) AS result;
SELECT LOCATE('', 'abc', 5) AS result;
SELECT LOCATE('', '', 1) AS result;
SELECT LOCATE('', '', 2) AS result;
SELECT LOCATE('x', NULL) AS result;
SELECT LOCATE(NULL, 'abc') AS result;
SELECT LOCATE('b', 'ab😀b', 2) AS result;
SELECT LOCATE('B', 'abc' COLLATE utf8mb4_0900_as_cs) AS result;
SELECT LOCATE('B', 'abc' COLLATE utf8mb4_0900_ai_ci) AS result;

-- INSTR uses the haystack collation
SELECT INSTR('ABC', 'b') AS result;
SELECT INSTR('ABC' COLLATE utf8mb4_0900_ai_ci, 'b') AS result;
SELECT INSTR('ABC' COLLATE utf8mb4_0900_as_cs, 'b') AS result;
SELECT INSTR('ab😀b', 'b') AS result;
SELECT COLLATION(INSTR('abc', 'a')) AS result;
