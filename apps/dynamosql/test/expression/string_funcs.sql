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
