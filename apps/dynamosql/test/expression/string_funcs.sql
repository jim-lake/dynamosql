-- Test CONCAT_WS function
SELECT CONCAT_WS(',', 'a', 'b', 'c') AS result;
SELECT CONCAT_WS('-', 'hello', 'world') AS result;
SELECT CONCAT_WS(',', 'a', NULL, 'c') AS result;
SELECT CONCAT_WS(NULL, 'a', 'b') AS result;

-- Test LPAD function
SELECT LPAD('hi', 5, '?') AS result;
SELECT LPAD('hello', 3, '?') AS result;
SELECT LPAD('hi', 10, 'ab') AS result;

-- Test RPAD function
SELECT RPAD('hi', 5, '?') AS result;
SELECT RPAD('hello', 3, '?') AS result;
SELECT RPAD('hi', 10, 'ab') AS result;

-- Test LOCATE function
SELECT LOCATE('bar', 'foobarbar') AS result;
SELECT LOCATE('xbar', 'foobar') AS result;
SELECT LOCATE('bar', 'foobarbar', 5) AS result;

-- Test INSTR (alias for LOCATE with swapped args)
SELECT INSTR('foobarbar', 'bar') AS result;

-- Test STRCMP function
SELECT STRCMP('text', 'text') AS result;
SELECT STRCMP('text', 'text2') AS result;
SELECT STRCMP('text2', 'text') AS result;

-- Test MID (alias for SUBSTRING)
SELECT MID('foobarbar', 4, 3) AS result;

-- Test OCTET_LENGTH (alias for LENGTH)
SELECT OCTET_LENGTH('hello') AS result;

-- Test ASCII function
SELECT ASCII('A') AS result;
SELECT ASCII('hello') AS result;
SELECT ASCII('') AS result;
SELECT ASCII(NULL) AS result;
SELECT ASCII('123') AS result;

-- Test ORD function
SELECT ORD('A') AS result;
SELECT ORD('hello') AS result;
SELECT ORD('') AS result;
SELECT ORD(NULL) AS result;

-- Test SPACE function
SELECT SPACE(5) AS result;
SELECT SPACE(0) AS result;
SELECT SPACE(NULL) AS result;

-- Test HEX function
SELECT HEX(255) AS result;
SELECT HEX(0) AS result;
SELECT HEX('hello') AS result;
SELECT HEX(NULL) AS result;

-- Test UNHEX function
SELECT UNHEX('48656C6C6F') AS result;
SELECT UNHEX('FF') AS result;
SELECT UNHEX(NULL) AS result;
