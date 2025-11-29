-- CONCAT edge cases
SELECT CONCAT() AS result;
SELECT CONCAT("") AS result;
SELECT CONCAT("", "") AS result;
SELECT CONCAT("a") AS result;
SELECT CONCAT(1) AS result;
SELECT CONCAT(1, 2) AS result;
SELECT CONCAT(1.5, 2.5) AS result;
SELECT CONCAT(TRUE, FALSE) AS result;

-- LENGTH edge cases
SELECT LENGTH() AS result;
SELECT LENGTH("", "") AS result;

-- LEFT edge cases
SELECT LEFT() AS result;
SELECT LEFT("test") AS result;
SELECT LEFT("test", 2, 3) AS result;
SELECT LEFT("", 0) AS result;
SELECT LEFT("test", -2147483648) AS result;
SELECT LEFT("test", 2147483647) AS result;
SELECT LEFT("test", 9223372036854775807) AS result;
SELECT LEFT("test", "abc") AS result;
SELECT LEFT(123, 2) AS result;
SELECT LEFT(123.456, 3) AS result;

-- RIGHT edge cases
SELECT RIGHT() AS result;
SELECT RIGHT("test") AS result;
SELECT RIGHT("test", 2, 3) AS result;
SELECT RIGHT("", 0) AS result;
SELECT RIGHT("test", -1) AS result;
SELECT RIGHT("test", -2147483648) AS result;
SELECT RIGHT("test", 2147483647) AS result;
SELECT RIGHT("test", "abc") AS result;
SELECT RIGHT(123, 2) AS result;
SELECT RIGHT(123.456, 3) AS result;

-- LOWER edge cases
SELECT LOWER() AS result;
SELECT LOWER("", "") AS result;
SELECT LOWER("") AS result;
SELECT LOWER("123") AS result;
SELECT LOWER("!@#$%") AS result;
SELECT LOWER(123) AS result;
SELECT LOWER(123.456) AS result;
SELECT LOWER(TRUE) AS result;

-- UPPER edge cases
SELECT UPPER() AS result;
SELECT UPPER("", "") AS result;
SELECT UPPER("") AS result;
SELECT UPPER("123") AS result;
SELECT UPPER("!@#$%") AS result;
SELECT UPPER(123) AS result;
SELECT UPPER(123.456) AS result;
SELECT UPPER(FALSE) AS result;

-- TRIM edge cases
SELECT TRIM() AS result;
SELECT TRIM("", "") AS result;
SELECT TRIM("") AS result;
SELECT TRIM(123) AS result;
SELECT TRIM(123.456) AS result;

-- LTRIM edge cases
SELECT LTRIM() AS result;
SELECT LTRIM("", "") AS result;
SELECT LTRIM("") AS result;
SELECT LTRIM(123) AS result;

-- RTRIM edge cases
SELECT RTRIM() AS result;
SELECT RTRIM("", "") AS result;
SELECT RTRIM("") AS result;
SELECT RTRIM(123) AS result;

-- REVERSE edge cases
SELECT REVERSE() AS result;
SELECT REVERSE("", "") AS result;
SELECT REVERSE("") AS result;
SELECT REVERSE(123) AS result;
SELECT REVERSE(123.456) AS result;

-- REPEAT edge cases
SELECT REPEAT() AS result;
SELECT REPEAT("a") AS result;
SELECT REPEAT("a", 2, 3) AS result;
SELECT REPEAT("", 5) AS result;
SELECT REPEAT("a", -1) AS result;
SELECT REPEAT("a", 0) AS result;
SELECT REPEAT("a", "abc") AS result;
SELECT REPEAT(123, 2) AS result;

-- CHAR_LENGTH edge cases
SELECT CHAR_LENGTH() AS result;
SELECT CHAR_LENGTH("", "") AS result;
SELECT CHAR_LENGTH("") AS result;
SELECT CHAR_LENGTH(123) AS result;

-- COALESCE edge cases
SELECT COALESCE() AS result;

-- IFNULL edge cases
SELECT IFNULL() AS result;
SELECT IFNULL(1) AS result;
SELECT IFNULL(1, 2, 3) AS result;

-- ABS edge cases
SELECT ABS() AS result;
SELECT ABS(1, 2) AS result;
SELECT ABS("") AS result;
SELECT ABS("abc") AS result;
SELECT ABS("123abc") AS result;
SELECT ABS("-123abc") AS result;
SELECT ABS(9223372036854775807) AS result;
SELECT ABS(-9223372036854775807) AS result;

-- CEIL edge cases
SELECT CEIL() AS result;
SELECT CEIL(1, 2) AS result;
SELECT CEIL("") AS result;
SELECT CEIL("abc") AS result;
SELECT CEIL(9223372036854775807) AS result;

-- FLOOR edge cases
SELECT FLOOR() AS result;
SELECT FLOOR(1, 2) AS result;
SELECT FLOOR("") AS result;
SELECT FLOOR("abc") AS result;
SELECT FLOOR(9223372036854775807) AS result;

-- ROUND edge cases
SELECT ROUND() AS result;
SELECT ROUND(1, 2, 3) AS result;
SELECT ROUND("") AS result;
SELECT ROUND("abc") AS result;
SELECT ROUND(1.5, "") AS result;
SELECT ROUND(1.5, "abc") AS result;
SELECT ROUND(9223372036854775807) AS result;
SELECT ROUND(1.5, -1) AS result;
SELECT ROUND(1.5, -2) AS result;
SELECT ROUND(15.5, -1) AS result;
SELECT ROUND(155.5, -2) AS result;

-- MOD edge cases
SELECT MOD() AS result;
SELECT MOD(10) AS result;
SELECT MOD(10, 3, 2) AS result;
SELECT MOD(10, 0) AS result;
SELECT MOD(0, 10) AS result;
SELECT MOD("", 3) AS result;
SELECT MOD(10, "") AS result;
SELECT MOD("abc", 3) AS result;
SELECT MOD(10, "abc") AS result;
SELECT MOD(-10, 3) AS result;
SELECT MOD(10, -3) AS result;
SELECT MOD(-10, -3) AS result;

-- POW edge cases
SELECT POW() AS result;
SELECT POW(2) AS result;
SELECT POW(2, 3, 4) AS result;
SELECT POW("", 2) AS result;
SELECT POW(2, "") AS result;
SELECT POW("abc", 2) AS result;
SELECT POW(2, "abc") AS result;
SELECT POW(0, 0) AS result;
SELECT POW(2, -1) AS result;
SELECT POW(-2, 3) AS result;
SELECT POW(-2, 2) AS result;
SELECT POW(2, 100) AS result;

-- SQRT edge cases
SELECT SQRT() AS result;
SELECT SQRT(4, 2) AS result;
SELECT SQRT("") AS result;
SELECT SQRT("abc") AS result;
SELECT SQRT(-1) AS result;
SELECT SQRT(0) AS result;

-- SIGN edge cases
SELECT SIGN() AS result;
SELECT SIGN(1, 2) AS result;
SELECT SIGN("") AS result;
SELECT SIGN("abc") AS result;
SELECT SIGN("123") AS result;
SELECT SIGN("-123") AS result;

-- GREATEST edge cases
SELECT GREATEST() AS result;
SELECT GREATEST(1) AS result;
SELECT GREATEST(1, 2) AS result;
SELECT GREATEST(1, 2, 3, 4, 5) AS result;
SELECT GREATEST("", "a") AS result;
SELECT GREATEST(1, "2") AS result;
SELECT GREATEST(1.5, 2) AS result;
SELECT GREATEST(1, 2.5) AS result;

-- LEAST edge cases
SELECT LEAST() AS result;
SELECT LEAST(1) AS result;
SELECT LEAST(1, 2) AS result;
SELECT LEAST(1, 2, 3, 4, 5) AS result;
SELECT LEAST("", "a") AS result;
SELECT LEAST(1, "2") AS result;
SELECT LEAST(1.5, 2) AS result;
SELECT LEAST(1, 2.5) AS result;

-- SUBSTRING edge cases
SELECT SUBSTRING() AS result;
SELECT SUBSTRING("hello") AS result;
SELECT SUBSTRING("hello", 2, 3, 4) AS result;
SELECT SUBSTRING("", 1, 1) AS result;
SELECT SUBSTRING("hello", 0, 2) AS result;
SELECT SUBSTRING("hello", -1, 2) AS result;
SELECT SUBSTRING("hello", 1, 0) AS result;
SELECT SUBSTRING("hello", 1, -1) AS result;
SELECT SUBSTRING("hello", "abc", 2) AS result;
SELECT SUBSTRING("hello", 1, "abc") AS result;
SELECT SUBSTRING(123, 1, 2) AS result;

-- REPLACE edge cases
SELECT REPLACE() AS result;
SELECT REPLACE("hello") AS result;
SELECT REPLACE("hello", "l") AS result;
SELECT REPLACE("hello", "l", "L", "extra") AS result;
SELECT REPLACE("", "a", "b") AS result;
SELECT REPLACE("hello", "", "x") AS result;
SELECT REPLACE("hello", "l", "") AS result;
SELECT REPLACE(123, "2", "5") AS result;
SELECT REPLACE("123", 2, 5) AS result;

-- CONCAT_WS edge cases
SELECT CONCAT_WS() AS result;
SELECT CONCAT_WS(",") AS result;
SELECT CONCAT_WS(",", "a") AS result;
SELECT CONCAT_WS("", "a", "b") AS result;
SELECT CONCAT_WS(NULL, "a", "b", "c") AS result;
SELECT CONCAT_WS(",", NULL, NULL) AS result;
SELECT CONCAT_WS(1, "a", "b") AS result;
SELECT CONCAT_WS(",", 1, 2, 3) AS result;

-- LPAD edge cases
SELECT LPAD() AS result;
SELECT LPAD("hi") AS result;
SELECT LPAD("hi", 5) AS result;
SELECT LPAD("hi", 5, "?", "extra") AS result;
SELECT LPAD("", 5, "?") AS result;
SELECT LPAD("hi", 0, "?") AS result;
SELECT LPAD("hi", -1, "?") AS result;
SELECT LPAD("hi", 5, "") AS result;
SELECT LPAD("hi", "abc", "?") AS result;
SELECT LPAD(123, 5, "0") AS result;

-- RPAD edge cases
SELECT RPAD() AS result;
SELECT RPAD("hi") AS result;
SELECT RPAD("hi", 5) AS result;
SELECT RPAD("hi", 5, "?", "extra") AS result;
SELECT RPAD("", 5, "?") AS result;
SELECT RPAD("hi", 0, "?") AS result;
SELECT RPAD("hi", -1, "?") AS result;
SELECT RPAD("hi", 5, "") AS result;
SELECT RPAD("hi", "abc", "?") AS result;
SELECT RPAD(123, 5, "0") AS result;

-- LOCATE edge cases
SELECT LOCATE() AS result;
SELECT LOCATE("bar") AS result;
SELECT LOCATE("bar", "foobar", 1, 2) AS result;
SELECT LOCATE("", "foobar") AS result;
SELECT LOCATE("bar", "") AS result;
SELECT LOCATE("", "") AS result;
SELECT LOCATE("bar", "foobar", 0) AS result;
SELECT LOCATE("bar", "foobar", -1) AS result;
SELECT LOCATE("bar", "foobar", 100) AS result;
SELECT LOCATE(123, "123456") AS result;
SELECT LOCATE("23", 123456) AS result;

-- INSTR edge cases
SELECT INSTR() AS result;
SELECT INSTR("foobar") AS result;
SELECT INSTR("foobar", "bar", 1) AS result;
SELECT INSTR("", "bar") AS result;
SELECT INSTR("foobar", "") AS result;
SELECT INSTR(123456, 34) AS result;

-- STRCMP edge cases
SELECT STRCMP() AS result;
SELECT STRCMP("text") AS result;
SELECT STRCMP("text", "text", "text") AS result;
SELECT STRCMP("", "") AS result;
SELECT STRCMP("", "a") AS result;
SELECT STRCMP("a", "") AS result;
SELECT STRCMP(123, 123) AS result;
SELECT STRCMP(123, "123") AS result;

-- ASCII edge cases
SELECT ASCII() AS result;
SELECT ASCII("", "") AS result;
SELECT ASCII(123) AS result;

-- ORD edge cases
SELECT ORD() AS result;
SELECT ORD("", "") AS result;
SELECT ORD(123) AS result;

-- SPACE edge cases
SELECT SPACE() AS result;
SELECT SPACE(5, 2) AS result;
SELECT SPACE(-1) AS result;
SELECT SPACE("abc") AS result;

-- HEX edge cases
SELECT HEX() AS result;
SELECT HEX(1, 2) AS result;
SELECT HEX("") AS result;
SELECT HEX(-1) AS result;
SELECT HEX(-255) AS result;

-- UNHEX edge cases
SELECT UNHEX() AS result;
SELECT UNHEX("", "") AS result;
SELECT UNHEX("") AS result;
SELECT UNHEX("G") AS result;
SELECT UNHEX("4865") AS result;
SELECT UNHEX(123) AS result;

-- DATE function edge cases
SELECT DATE() AS result;
SELECT DATE("2024-01-15", "extra") AS result;
SELECT DATE("") AS result;
SELECT DATE("invalid") AS result;
SELECT DATE("2024-13-01") AS result;
SELECT DATE("2024-01-32") AS result;
SELECT DATE(123) AS result;

-- YEAR edge cases
SELECT YEAR() AS result;
SELECT YEAR("2024-01-15", "extra") AS result;
SELECT YEAR("") AS result;
SELECT YEAR("invalid") AS result;
SELECT YEAR(20240115) AS result;

-- MONTH edge cases
SELECT MONTH() AS result;
SELECT MONTH("2024-01-15", "extra") AS result;
SELECT MONTH("") AS result;
SELECT MONTH("invalid") AS result;

-- DAY edge cases
SELECT DAY() AS result;
SELECT DAY("2024-01-15", "extra") AS result;
SELECT DAY("") AS result;
SELECT DAY("invalid") AS result;

-- HOUR edge cases
SELECT HOUR() AS result;
SELECT HOUR("2024-01-15 14:30:00", "extra") AS result;
SELECT HOUR("") AS result;
SELECT HOUR("invalid") AS result;

-- MINUTE edge cases
SELECT MINUTE() AS result;
SELECT MINUTE("2024-01-15 14:30:00", "extra") AS result;
SELECT MINUTE("") AS result;
SELECT MINUTE("invalid") AS result;

-- SECOND edge cases
SELECT SECOND() AS result;
SELECT SECOND("2024-01-15 14:30:00", "extra") AS result;
SELECT SECOND("") AS result;
SELECT SECOND("invalid") AS result;

-- DAYOFWEEK edge cases
SELECT DAYOFWEEK() AS result;
SELECT DAYOFWEEK("2024-01-15", "extra") AS result;
SELECT DAYOFWEEK("") AS result;
SELECT DAYOFWEEK("invalid") AS result;

-- DAYNAME edge cases
SELECT DAYNAME() AS result;
SELECT DAYNAME("2024-01-15", "extra") AS result;
SELECT DAYNAME("") AS result;
SELECT DAYNAME("invalid") AS result;

-- MONTHNAME edge cases
SELECT MONTHNAME() AS result;
SELECT MONTHNAME("2024-01-15", "extra") AS result;
SELECT MONTHNAME("") AS result;
SELECT MONTHNAME("invalid") AS result;

-- DAYOFYEAR edge cases
SELECT DAYOFYEAR() AS result;
SELECT DAYOFYEAR("2024-01-15", "extra") AS result;
SELECT DAYOFYEAR("") AS result;
SELECT DAYOFYEAR("invalid") AS result;

-- WEEK edge cases
SELECT WEEK("", 0) AS result;
SELECT WEEK("invalid", 0) AS result;
SELECT WEEK("2024-01-15", -1) AS result;
SELECT WEEK("2024-01-15", 8) AS result;

-- WEEKDAY edge cases
SELECT WEEKDAY("") AS result;
SELECT WEEKDAY("invalid") AS result;

-- QUARTER edge cases
SELECT QUARTER("") AS result;
SELECT QUARTER("invalid") AS result;

-- TIME edge cases
SELECT TIME("") AS result;
SELECT TIME("invalid") AS result;

-- MICROSECOND edge cases
SELECT MICROSECOND("") AS result;
SELECT MICROSECOND("invalid") AS result;

-- LAST_DAY edge cases
SELECT LAST_DAY("") AS result;
SELECT LAST_DAY("invalid") AS result;

-- WEEKOFYEAR edge cases
SELECT WEEKOFYEAR("") AS result;
SELECT WEEKOFYEAR("invalid") AS result;

-- YEARWEEK edge cases
SELECT YEARWEEK("", 0) AS result;
SELECT YEARWEEK("invalid", 0) AS result;

-- ADDDATE edge cases
SELECT ADDDATE() AS result;
SELECT ADDDATE("2024-01-15") AS result;
SELECT ADDDATE("", INTERVAL 1 DAY) AS result;
SELECT ADDDATE("invalid", INTERVAL 1 DAY) AS result;

-- IF edge cases
SELECT IF("", "yes", "no") AS result;
SELECT IF("abc", "yes", "no") AS result;
SELECT IF(0.0, "yes", "no") AS result;

-- DATE_ADD edge cases
SELECT DATE_ADD() AS result;
SELECT DATE_ADD("2024-01-15") AS result;
SELECT DATE_ADD("", INTERVAL 1 DAY) AS result;
SELECT DATE_ADD("invalid", INTERVAL 1 DAY) AS result;

-- DATE_SUB edge cases
SELECT DATE_SUB() AS result;
SELECT DATE_SUB("2024-01-15") AS result;
SELECT DATE_SUB("", INTERVAL 1 DAY) AS result;
SELECT DATE_SUB("invalid", INTERVAL 1 DAY) AS result;

-- TIMESTAMPDIFF edge cases
SELECT TIMESTAMPDIFF(DAY, "", "2024-01-15") AS result;
SELECT TIMESTAMPDIFF(DAY, "invalid", "2024-01-15") AS result;
SELECT TIMESTAMPDIFF(DAY, "2024-01-01", "") AS result;
SELECT TIMESTAMPDIFF(DAY, "2024-01-01", "invalid") AS result;

-- NULLIF edge cases
SELECT NULLIF("", "") AS result;
SELECT NULLIF("", "a") AS result;
SELECT NULLIF(0, 0) AS result;
SELECT NULLIF(0, FALSE) AS result;

-- UNIX_TIMESTAMP edge cases
SELECT UNIX_TIMESTAMP("") AS result;
SELECT UNIX_TIMESTAMP("invalid") AS result;

-- NOW edge cases
SELECT NOW(8) AS result;

-- CURTIME edge cases
SELECT CURTIME(8) AS result;

-- SYSDATE edge cases
SELECT SYSDATE(8) AS result;

-- BIN edge cases
SELECT BIN("abc") AS result;
SELECT BIN(NULL) AS result;

-- OCT edge cases
SELECT OCT("abc") AS result;
SELECT OCT(NULL) AS result;

-- DEGREES edge cases
SELECT DEGREES("") AS result;
SELECT DEGREES("abc") AS result;
SELECT DEGREES(NULL) AS result;

-- RADIANS edge cases
SELECT RADIANS("") AS result;
SELECT RADIANS("abc") AS result;
SELECT RADIANS(NULL) AS result;

-- EXP edge cases
SELECT EXP("") AS result;
SELECT EXP("abc") AS result;
SELECT EXP(NULL) AS result;

-- LN edge cases
SELECT LN("") AS result;
SELECT LN("abc") AS result;
SELECT LN(0) AS result;
SELECT LN(-1) AS result;
SELECT LN(NULL) AS result;

-- LOG edge cases
SELECT LOG("") AS result;
SELECT LOG("abc") AS result;
SELECT LOG(0) AS result;
SELECT LOG(-1) AS result;
SELECT LOG(NULL) AS result;
SELECT LOG(2, "") AS result;
SELECT LOG(2, "abc") AS result;
SELECT LOG(2, 0) AS result;
SELECT LOG(2, -1) AS result;

-- LOG2 edge cases
SELECT LOG2("") AS result;
SELECT LOG2("abc") AS result;
SELECT LOG2(0) AS result;
SELECT LOG2(-1) AS result;
SELECT LOG2(NULL) AS result;

-- LOG10 edge cases
SELECT LOG10("") AS result;
SELECT LOG10("abc") AS result;
SELECT LOG10(0) AS result;
SELECT LOG10(-1) AS result;
SELECT LOG10(NULL) AS result;

-- COS edge cases
SELECT COS("") AS result;
SELECT COS("abc") AS result;
SELECT COS(NULL) AS result;

-- SIN edge cases
SELECT SIN("") AS result;
SELECT SIN("abc") AS result;
SELECT SIN(NULL) AS result;

-- TAN edge cases
SELECT TAN("") AS result;
SELECT TAN("abc") AS result;
SELECT TAN(NULL) AS result;

-- ACOS edge cases
SELECT ACOS("") AS result;
SELECT ACOS("abc") AS result;
SELECT ACOS(2) AS result;
SELECT ACOS(-2) AS result;
SELECT ACOS(NULL) AS result;

-- ASIN edge cases
SELECT ASIN("") AS result;
SELECT ASIN("abc") AS result;
SELECT ASIN(2) AS result;
SELECT ASIN(-2) AS result;
SELECT ASIN(NULL) AS result;

-- ATAN edge cases
SELECT ATAN("") AS result;
SELECT ATAN("abc") AS result;
SELECT ATAN(NULL) AS result;

-- ATAN2 edge cases
SELECT ATAN2("", 1) AS result;
SELECT ATAN2(1, "") AS result;
SELECT ATAN2("abc", 1) AS result;
SELECT ATAN2(1, "abc") AS result;
SELECT ATAN2(0, 0) AS result;
SELECT ATAN2(NULL, 1) AS result;
SELECT ATAN2(1, NULL) AS result;

-- COT edge cases
SELECT COT(NULL) AS result;

-- CAST edge cases
SELECT CAST("" AS SIGNED) AS result;
SELECT CAST("abc" AS SIGNED) AS result;
SELECT CAST("123abc" AS SIGNED) AS result;
SELECT CAST("9223372036854775807" AS SIGNED) AS result;
SELECT CAST("-9223372036854775808" AS SIGNED) AS result;
SELECT CAST("" AS CHAR) AS result;
SELECT CAST("" AS DATETIME) AS result;
SELECT CAST("abc" AS DATETIME) AS result;
SELECT CAST("" AS DATE) AS result;
SELECT CAST("abc" AS DATE) AS result;
SELECT CAST("" AS TIME) AS result;
SELECT CAST("abc" AS TIME) AS result;

-- DATE_FORMAT edge cases
SELECT DATE_FORMAT("", "%Y-%m-%d") AS result;
SELECT DATE_FORMAT("invalid", "%Y-%m-%d") AS result;
SELECT DATE_FORMAT(NULL, "%Y-%m-%d") AS result;
SELECT DATE_FORMAT("2024-01-15", NULL) AS result;

-- DATEDIFF edge cases
SELECT DATEDIFF("", "2024-01-01") AS result;
SELECT DATEDIFF("invalid", "2024-01-01") AS result;
SELECT DATEDIFF("2024-01-15", "") AS result;
SELECT DATEDIFF("2024-01-15", "invalid") AS result;
SELECT DATEDIFF(NULL, "2024-01-01") AS result;
SELECT DATEDIFF("2024-01-15", NULL) AS result;

-- FROM_UNIXTIME edge cases
SELECT FROM_UNIXTIME("") AS result;
SELECT FROM_UNIXTIME("abc") AS result;
SELECT FROM_UNIXTIME(NULL) AS result;

-- SLEEP edge cases
SELECT SLEEP("") AS result;
SELECT SLEEP("abc") AS result;

-- SUM edge cases
SELECT SUM("") AS result;
SELECT SUM("abc") AS result;

-- AVG edge cases
SELECT AVG("") AS result;
SELECT AVG("abc") AS result;
