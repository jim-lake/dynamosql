-- CONCAT with various types
SELECT CONCAT(1, 2, 3, 4, 5) AS result;
SELECT CONCAT(1.5, 2.5, 3.5) AS result;
SELECT CONCAT("a", 1, "b", 2) AS result;
SELECT CONCAT(TRUE, FALSE, 1, 0) AS result;

-- LEFT with various lengths
SELECT LEFT("abcdefghij", 1) AS result;
SELECT LEFT("abcdefghij", 5) AS result;
SELECT LEFT("abcdefghij", 10) AS result;
SELECT LEFT("abcdefghij", 100) AS result;
SELECT LEFT("test", 2.5) AS result;
SELECT LEFT("test", 2.9) AS result;

-- RIGHT with various lengths
SELECT RIGHT("abcdefghij", 1) AS result;
SELECT RIGHT("abcdefghij", 5) AS result;
SELECT RIGHT("abcdefghij", 10) AS result;
SELECT RIGHT("abcdefghij", 100) AS result;
SELECT RIGHT("test", 2.5) AS result;
SELECT RIGHT("test", 2.9) AS result;

-- REPEAT with various counts
SELECT REPEAT("x", 1) AS result;
SELECT REPEAT("x", 5) AS result;
SELECT REPEAT("x", 10) AS result;
SELECT REPEAT("ab", 3) AS result;
SELECT REPEAT("test", 2) AS result;

-- SUBSTRING with various positions and lengths
SELECT SUBSTRING("hello world", 1, 5) AS result;
SELECT SUBSTRING("hello world", 7, 5) AS result;
SELECT SUBSTRING("hello world", 1, 100) AS result;
SELECT SUBSTRING("hello world", -5, 5) AS result;
SELECT SUBSTRING("hello world", -5) AS result;
SELECT SUBSTRING("hello world", 7) AS result;

-- REPLACE with various patterns
SELECT REPLACE("hello world", "world", "there") AS result;
SELECT REPLACE("hello world", "o", "0") AS result;
SELECT REPLACE("aaa", "a", "bb") AS result;
SELECT REPLACE("test", "x", "y") AS result;
SELECT REPLACE("hello", "ll", "") AS result;

-- CONCAT_WS with various separators
SELECT CONCAT_WS(",", "a", "b", "c", "d") AS result;
SELECT CONCAT_WS("-", "2024", "01", "15") AS result;
SELECT CONCAT_WS(" ", "hello", "world") AS result;
SELECT CONCAT_WS("", "a", "b", "c") AS result;
SELECT CONCAT_WS("|", 1, 2, 3) AS result;

-- LPAD with various lengths and pads
SELECT LPAD("hi", 5, "0") AS result;
SELECT LPAD("hi", 10, "x") AS result;
SELECT LPAD("hello", 10, "ab") AS result;
SELECT LPAD("test", 8, "123") AS result;
SELECT LPAD("x", 5, "abc") AS result;

-- RPAD with various lengths and pads
SELECT RPAD("hi", 5, "0") AS result;
SELECT RPAD("hi", 10, "x") AS result;
SELECT RPAD("hello", 10, "ab") AS result;
SELECT RPAD("test", 8, "123") AS result;
SELECT RPAD("x", 5, "abc") AS result;

-- LOCATE with various positions
SELECT LOCATE("bar", "foobarbar") AS result;
SELECT LOCATE("bar", "foobarbar", 1) AS result;
SELECT LOCATE("bar", "foobarbar", 4) AS result;
SELECT LOCATE("bar", "foobarbar", 7) AS result;
SELECT LOCATE("o", "foobar") AS result;
SELECT LOCATE("o", "foobar", 2) AS result;
SELECT LOCATE("o", "foobar", 3) AS result;

-- STRCMP with various strings
SELECT STRCMP("abc", "abc") AS result;
SELECT STRCMP("abc", "abd") AS result;
SELECT STRCMP("abd", "abc") AS result;
SELECT STRCMP("a", "b") AS result;
SELECT STRCMP("b", "a") AS result;
SELECT STRCMP("123", "123") AS result;
SELECT STRCMP("123", "124") AS result;

-- ABS with various numbers
SELECT ABS(0) AS result;
SELECT ABS(5) AS result;
SELECT ABS(-5) AS result;
SELECT ABS(3.14) AS result;
SELECT ABS(-3.14) AS result;
SELECT ABS(100) AS result;
SELECT ABS(-100) AS result;
SELECT ABS(0.001) AS result;
SELECT ABS(-0.001) AS result;

-- CEIL with various numbers
SELECT CEIL(0) AS result;
SELECT CEIL(1) AS result;
SELECT CEIL(1.1) AS result;
SELECT CEIL(1.9) AS result;
SELECT CEIL(-1.1) AS result;
SELECT CEIL(-1.9) AS result;
SELECT CEIL(100.5) AS result;

-- FLOOR with various numbers
SELECT FLOOR(0) AS result;
SELECT FLOOR(1) AS result;
SELECT FLOOR(1.1) AS result;
SELECT FLOOR(1.9) AS result;
SELECT FLOOR(-1.1) AS result;
SELECT FLOOR(-1.9) AS result;
SELECT FLOOR(100.5) AS result;

-- ROUND with various numbers and decimals
SELECT ROUND(0) AS result;
SELECT ROUND(1.4) AS result;
SELECT ROUND(1.5) AS result;
SELECT ROUND(1.6) AS result;
SELECT ROUND(-1.4) AS result;
SELECT ROUND(-1.5) AS result;
SELECT ROUND(-1.6) AS result;
SELECT ROUND(3.14159, 0) AS result;
SELECT ROUND(3.14159, 1) AS result;
SELECT ROUND(3.14159, 2) AS result;
SELECT ROUND(3.14159, 3) AS result;
SELECT ROUND(3.14159, 4) AS result;
SELECT ROUND(123.456, 0) AS result;
SELECT ROUND(123.456, 1) AS result;
SELECT ROUND(123.456, 2) AS result;

-- MOD with various numbers
SELECT MOD(10, 3) AS result;
SELECT MOD(10, 4) AS result;
SELECT MOD(10, 5) AS result;
SELECT MOD(11, 3) AS result;
SELECT MOD(100, 7) AS result;
SELECT MOD(5, 10) AS result;
SELECT MOD(1, 1) AS result;

-- POW with various bases and exponents
SELECT POW(2, 0) AS result;
SELECT POW(2, 1) AS result;
SELECT POW(2, 2) AS result;
SELECT POW(2, 3) AS result;
SELECT POW(2, 4) AS result;
SELECT POW(3, 2) AS result;
SELECT POW(5, 2) AS result;
SELECT POW(10, 2) AS result;
SELECT POW(2, 10) AS result;
SELECT POW(0.5, 2) AS result;

-- SQRT with various numbers
SELECT SQRT(0) AS result;
SELECT SQRT(1) AS result;
SELECT SQRT(4) AS result;
SELECT SQRT(9) AS result;
SELECT SQRT(16) AS result;
SELECT SQRT(25) AS result;
SELECT SQRT(100) AS result;
SELECT SQRT(2) AS result;
SELECT SQRT(3) AS result;

-- SIGN with various numbers
SELECT SIGN(-100) AS result;
SELECT SIGN(-10) AS result;
SELECT SIGN(-1) AS result;
SELECT SIGN(0) AS result;
SELECT SIGN(1) AS result;
SELECT SIGN(10) AS result;
SELECT SIGN(100) AS result;
SELECT SIGN(-0.5) AS result;
SELECT SIGN(0.5) AS result;

-- GREATEST with various arguments
SELECT GREATEST(1, 2) AS result;
SELECT GREATEST(1, 2, 3) AS result;
SELECT GREATEST(5, 2, 8, 1, 9) AS result;
SELECT GREATEST(-5, -2, -8) AS result;
SELECT GREATEST(1.5, 2.3, 1.9) AS result;
SELECT GREATEST("a", "b", "c", "d") AS result;
SELECT GREATEST("z", "a", "m", "b") AS result;

-- LEAST with various arguments
SELECT LEAST(1, 2) AS result;
SELECT LEAST(1, 2, 3) AS result;
SELECT LEAST(5, 2, 8, 1, 9) AS result;
SELECT LEAST(-5, -2, -8) AS result;
SELECT LEAST(1.5, 2.3, 1.9) AS result;
SELECT LEAST("a", "b", "c", "d") AS result;
SELECT LEAST("z", "a", "m", "b") AS result;

-- NULLIF with various values
SELECT NULLIF(1, 2) AS result;
SELECT NULLIF(1, 1) AS result;
SELECT NULLIF("a", "b") AS result;
SELECT NULLIF("a", "a") AS result;
SELECT NULLIF(0, 1) AS result;
SELECT NULLIF(0, 0) AS result;

-- COALESCE with various arguments
SELECT COALESCE(1) AS result;
SELECT COALESCE(NULL, 1) AS result;
SELECT COALESCE(NULL, NULL, 1) AS result;
SELECT COALESCE(NULL, NULL, NULL, 1) AS result;
SELECT COALESCE(1, 2, 3) AS result;
SELECT COALESCE(NULL, 2, 3) AS result;
SELECT COALESCE("a") AS result;
SELECT COALESCE(NULL, "a") AS result;

-- IFNULL with various values
SELECT IFNULL(1, 2) AS result;
SELECT IFNULL(NULL, 2) AS result;
SELECT IFNULL("a", "b") AS result;
SELECT IFNULL(NULL, "b") AS result;
SELECT IFNULL(0, 1) AS result;
SELECT IFNULL(NULL, 0) AS result;

-- IF with various conditions
SELECT IF(1, "yes", "no") AS result;
SELECT IF(0, "yes", "no") AS result;
SELECT IF(TRUE, "yes", "no") AS result;
SELECT IF(FALSE, "yes", "no") AS result;
SELECT IF(1 > 0, "yes", "no") AS result;
SELECT IF(1 < 0, "yes", "no") AS result;
SELECT IF(5, "yes", "no") AS result;
SELECT IF(-5, "yes", "no") AS result;

-- YEAR with various dates
SELECT YEAR("2024-01-01") AS result;
SELECT YEAR("2024-06-15") AS result;
SELECT YEAR("2024-12-31") AS result;
SELECT YEAR("2023-01-01") AS result;
SELECT YEAR("2025-01-01") AS result;

-- MONTH with various dates
SELECT MONTH("2024-01-15") AS result;
SELECT MONTH("2024-02-15") AS result;
SELECT MONTH("2024-06-15") AS result;
SELECT MONTH("2024-12-15") AS result;

-- DAY with various dates
SELECT DAY("2024-01-01") AS result;
SELECT DAY("2024-01-15") AS result;
SELECT DAY("2024-01-31") AS result;
SELECT DAY("2024-06-15") AS result;

-- HOUR with various times
SELECT HOUR("2024-01-15 00:00:00") AS result;
SELECT HOUR("2024-01-15 06:30:00") AS result;
SELECT HOUR("2024-01-15 12:00:00") AS result;
SELECT HOUR("2024-01-15 18:45:00") AS result;
SELECT HOUR("2024-01-15 23:59:59") AS result;

-- MINUTE with various times
SELECT MINUTE("2024-01-15 14:00:00") AS result;
SELECT MINUTE("2024-01-15 14:15:00") AS result;
SELECT MINUTE("2024-01-15 14:30:00") AS result;
SELECT MINUTE("2024-01-15 14:45:00") AS result;
SELECT MINUTE("2024-01-15 14:59:00") AS result;

-- SECOND with various times
SELECT SECOND("2024-01-15 14:30:00") AS result;
SELECT SECOND("2024-01-15 14:30:15") AS result;
SELECT SECOND("2024-01-15 14:30:30") AS result;
SELECT SECOND("2024-01-15 14:30:45") AS result;
SELECT SECOND("2024-01-15 14:30:59") AS result;

-- DAYOFWEEK with various dates
SELECT DAYOFWEEK("2024-01-01") AS result;
SELECT DAYOFWEEK("2024-01-07") AS result;
SELECT DAYOFWEEK("2024-01-14") AS result;
SELECT DAYOFWEEK("2024-01-15") AS result;
SELECT DAYOFWEEK("2024-01-21") AS result;

-- DAYNAME with various dates
SELECT DAYNAME("2024-01-01") AS result;
SELECT DAYNAME("2024-01-07") AS result;
SELECT DAYNAME("2024-01-14") AS result;
SELECT DAYNAME("2024-01-15") AS result;
SELECT DAYNAME("2024-01-21") AS result;

-- MONTHNAME with various dates
SELECT MONTHNAME("2024-01-15") AS result;
SELECT MONTHNAME("2024-02-15") AS result;
SELECT MONTHNAME("2024-03-15") AS result;
SELECT MONTHNAME("2024-06-15") AS result;
SELECT MONTHNAME("2024-12-15") AS result;

-- DAYOFYEAR with various dates
SELECT DAYOFYEAR("2024-01-01") AS result;
SELECT DAYOFYEAR("2024-01-31") AS result;
SELECT DAYOFYEAR("2024-06-01") AS result;
SELECT DAYOFYEAR("2024-12-31") AS result;

-- WEEK with various dates and modes
SELECT WEEK("2024-01-01", 0) AS result;
SELECT WEEK("2024-01-01", 1) AS result;
SELECT WEEK("2024-01-07", 0) AS result;
SELECT WEEK("2024-06-15", 0) AS result;
SELECT WEEK("2024-12-31", 0) AS result;

-- WEEKDAY with various dates
SELECT WEEKDAY("2024-01-01") AS result;
SELECT WEEKDAY("2024-01-07") AS result;
SELECT WEEKDAY("2024-01-14") AS result;
SELECT WEEKDAY("2024-01-15") AS result;

-- QUARTER with various dates
SELECT QUARTER("2024-01-15") AS result;
SELECT QUARTER("2024-02-15") AS result;
SELECT QUARTER("2024-04-15") AS result;
SELECT QUARTER("2024-07-15") AS result;
SELECT QUARTER("2024-10-15") AS result;

-- TIME with various datetimes
SELECT TIME("2024-01-15 00:00:00") AS result;
SELECT TIME("2024-01-15 12:34:56") AS result;
SELECT TIME("2024-01-15 23:59:59") AS result;

-- MICROSECOND with various times
SELECT MICROSECOND("2024-01-15 12:34:56.000000") AS result;
SELECT MICROSECOND("2024-01-15 12:34:56.123456") AS result;
SELECT MICROSECOND("2024-01-15 12:34:56.999999") AS result;

-- LAST_DAY with various dates
SELECT LAST_DAY("2024-01-01") AS result;
SELECT LAST_DAY("2024-01-15") AS result;
SELECT LAST_DAY("2024-02-15") AS result;
SELECT LAST_DAY("2024-12-15") AS result;

-- WEEKOFYEAR with various dates
SELECT WEEKOFYEAR("2024-01-01") AS result;
SELECT WEEKOFYEAR("2024-01-07") AS result;
SELECT WEEKOFYEAR("2024-06-15") AS result;
SELECT WEEKOFYEAR("2024-12-31") AS result;

-- YEARWEEK with various dates and modes
SELECT YEARWEEK("2024-01-01", 0) AS result;
SELECT YEARWEEK("2024-01-01", 1) AS result;
SELECT YEARWEEK("2024-06-15", 0) AS result;
SELECT YEARWEEK("2024-12-31", 0) AS result;

-- DATE_ADD with various intervals
SELECT DATE_ADD("2024-01-15", INTERVAL 1 DAY) AS result;
SELECT DATE_ADD("2024-01-15", INTERVAL 7 DAY) AS result;
SELECT DATE_ADD("2024-01-15", INTERVAL 1 MONTH) AS result;
SELECT DATE_ADD("2024-01-15", INTERVAL 3 MONTH) AS result;
SELECT DATE_ADD("2024-01-15", INTERVAL 1 YEAR) AS result;
SELECT DATE_ADD("2024-01-15 10:30:00", INTERVAL 1 HOUR) AS result;
SELECT DATE_ADD("2024-01-15 10:30:00", INTERVAL 30 MINUTE) AS result;
SELECT DATE_ADD("2024-01-15 10:30:00", INTERVAL 45 SECOND) AS result;

-- DATE_SUB with various intervals
SELECT DATE_SUB("2024-01-15", INTERVAL 1 DAY) AS result;
SELECT DATE_SUB("2024-01-15", INTERVAL 7 DAY) AS result;
SELECT DATE_SUB("2024-01-15", INTERVAL 1 MONTH) AS result;
SELECT DATE_SUB("2024-01-15", INTERVAL 3 MONTH) AS result;
SELECT DATE_SUB("2024-01-15", INTERVAL 1 YEAR) AS result;
SELECT DATE_SUB("2024-01-15 10:30:00", INTERVAL 1 HOUR) AS result;
SELECT DATE_SUB("2024-01-15 10:30:00", INTERVAL 30 MINUTE) AS result;
SELECT DATE_SUB("2024-01-15 10:30:00", INTERVAL 45 SECOND) AS result;

-- TIMESTAMPDIFF with various units
SELECT TIMESTAMPDIFF(SECOND, "2024-01-15 10:00:00", "2024-01-15 10:00:30") AS result;
SELECT TIMESTAMPDIFF(MINUTE, "2024-01-15 10:00:00", "2024-01-15 10:30:00") AS result;
SELECT TIMESTAMPDIFF(HOUR, "2024-01-15 10:00:00", "2024-01-15 15:00:00") AS result;
SELECT TIMESTAMPDIFF(DAY, "2024-01-01", "2024-01-15") AS result;
SELECT TIMESTAMPDIFF(DAY, "2024-01-15", "2024-01-01") AS result;
SELECT TIMESTAMPDIFF(MONTH, "2024-01-15", "2024-06-15") AS result;
SELECT TIMESTAMPDIFF(YEAR, "2020-01-15", "2024-01-15") AS result;

-- DATEDIFF with various dates
SELECT DATEDIFF("2024-01-15", "2024-01-01") AS result;
SELECT DATEDIFF("2024-01-01", "2024-01-15") AS result;
SELECT DATEDIFF("2024-12-31", "2024-01-01") AS result;
SELECT DATEDIFF("2024-01-01", "2023-01-01") AS result;

-- DATE_FORMAT with various formats
SELECT DATE_FORMAT("2024-01-15", "%Y") AS result;
SELECT DATE_FORMAT("2024-01-15", "%m") AS result;
SELECT DATE_FORMAT("2024-01-15", "%d") AS result;
SELECT DATE_FORMAT("2024-01-15", "%Y-%m-%d") AS result;
SELECT DATE_FORMAT("2024-01-15", "%d/%m/%Y") AS result;
SELECT DATE_FORMAT("2024-01-15 14:30:45", "%Y-%m-%d %H:%i:%s") AS result;
SELECT DATE_FORMAT("2024-01-15", "%W, %M %d, %Y") AS result;

-- FROM_UNIXTIME with various timestamps
SELECT FROM_UNIXTIME(0) AS result;
SELECT FROM_UNIXTIME(1000000000) AS result;
SELECT FROM_UNIXTIME(1234567890) AS result;
SELECT FROM_UNIXTIME(1700000000) AS result;

-- UNIX_TIMESTAMP with various dates
SELECT UNIX_TIMESTAMP("1970-01-01 00:00:00") AS result;
SELECT UNIX_TIMESTAMP("2000-01-01 00:00:00") AS result;
SELECT UNIX_TIMESTAMP("2024-01-15 10:30:00") AS result;

-- CAST with various types
SELECT CAST(123 AS SIGNED) AS result;
SELECT CAST(-123 AS SIGNED) AS result;
SELECT CAST(123.45 AS SIGNED) AS result;
SELECT CAST("123" AS SIGNED) AS result;
SELECT CAST("-456" AS SIGNED) AS result;
SELECT CAST(123 AS CHAR) AS result;
SELECT CAST(123.45 AS CHAR) AS result;
SELECT CAST("2024-01-15" AS DATE) AS result;
SELECT CAST("2024-01-15 10:30:00" AS DATE) AS result;
SELECT CAST("10:30:00" AS TIME) AS result;
SELECT CAST("2024-01-15 10:30:00" AS TIME) AS result;
SELECT CAST("2024-01-15 10:30:00" AS DATETIME) AS result;

-- BIN with various numbers
SELECT BIN(0) AS result;
SELECT BIN(1) AS result;
SELECT BIN(2) AS result;
SELECT BIN(10) AS result;
SELECT BIN(255) AS result;
SELECT BIN(1024) AS result;

-- OCT with various numbers
SELECT OCT(0) AS result;
SELECT OCT(1) AS result;
SELECT OCT(8) AS result;
SELECT OCT(10) AS result;
SELECT OCT(64) AS result;
SELECT OCT(255) AS result;

-- HEX with various inputs
SELECT HEX(0) AS result;
SELECT HEX(10) AS result;
SELECT HEX(255) AS result;
SELECT HEX(256) AS result;
SELECT HEX("hello") AS result;
SELECT HEX("test") AS result;

-- UNHEX with various inputs
SELECT UNHEX("48656C6C6F") AS result;
SELECT UNHEX("74657374") AS result;
SELECT UNHEX("FF") AS result;
SELECT UNHEX("00") AS result;

-- ASCII with various characters
SELECT ASCII("A") AS result;
SELECT ASCII("Z") AS result;
SELECT ASCII("a") AS result;
SELECT ASCII("z") AS result;
SELECT ASCII("0") AS result;
SELECT ASCII("9") AS result;
SELECT ASCII(" ") AS result;

-- ORD with various characters
SELECT ORD("A") AS result;
SELECT ORD("Z") AS result;
SELECT ORD("a") AS result;
SELECT ORD("z") AS result;

-- SPACE with various lengths
SELECT SPACE(0) AS result;
SELECT SPACE(1) AS result;
SELECT SPACE(5) AS result;
SELECT SPACE(10) AS result;

-- DEGREES with various radians
SELECT DEGREES(0) AS result;
SELECT DEGREES(1) AS result;
SELECT DEGREES(3.14159265359) AS result;

-- RADIANS with various degrees
SELECT RADIANS(0) AS result;
SELECT RADIANS(90) AS result;
SELECT RADIANS(180) AS result;
SELECT RADIANS(360) AS result;

-- EXP with various values
SELECT EXP(0) AS result;
SELECT EXP(1) AS result;
SELECT EXP(2) AS result;

-- LN with various values
SELECT LN(1) AS result;
SELECT LN(2) AS result;
SELECT LN(10) AS result;
SELECT LN(2.718281828459045) AS result;

-- LOG with various values
SELECT LOG(1) AS result;
SELECT LOG(10) AS result;
SELECT LOG(100) AS result;
SELECT LOG(2, 8) AS result;
SELECT LOG(2, 16) AS result;
SELECT LOG(10, 100) AS result;

-- LOG2 with various values
SELECT LOG2(1) AS result;
SELECT LOG2(2) AS result;
SELECT LOG2(8) AS result;
SELECT LOG2(1024) AS result;

-- LOG10 with various values
SELECT LOG10(1) AS result;
SELECT LOG10(10) AS result;
SELECT LOG10(100) AS result;
SELECT LOG10(1000) AS result;

-- Trigonometric functions
SELECT COS(0) AS result;
SELECT COS(3.14159265359) AS result;
SELECT SIN(0) AS result;
SELECT SIN(1.5707963267949) AS result;
SELECT TAN(0) AS result;
SELECT TAN(0.785398163397448) AS result;
SELECT ACOS(0) AS result;
SELECT ACOS(1) AS result;
SELECT ASIN(0) AS result;
SELECT ASIN(1) AS result;
SELECT ATAN(0) AS result;
SELECT ATAN(1) AS result;
SELECT ATAN2(0, 1) AS result;
SELECT ATAN2(1, 1) AS result;
SELECT ATAN2(1, 0) AS result;
SELECT COT(0.785398163397448) AS result;
SELECT COT(1.5707963267949) AS result;

-- SLEEP with various durations
SELECT SLEEP(0) AS result;

-- SUM with various values
SELECT SUM(1) AS result;
SELECT SUM(10) AS result;
SELECT SUM(100.5) AS result;
SELECT SUM(-5) AS result;

-- AVG with various values
SELECT AVG(1) AS result;
SELECT AVG(10) AS result;
SELECT AVG(100.5) AS result;
SELECT AVG(-5) AS result;

-- MIN with various values
SELECT MIN(1) AS result;
SELECT MIN(100) AS result;
SELECT MIN(-50) AS result;
SELECT MIN("apple") AS result;

-- MAX with various values
SELECT MAX(1) AS result;
SELECT MAX(100) AS result;
SELECT MAX(-50) AS result;
SELECT MAX("zebra") AS result;

-- COUNT with various values
SELECT COUNT(1) AS result;
SELECT COUNT("test") AS result;
SELECT COUNT(0) AS result;
