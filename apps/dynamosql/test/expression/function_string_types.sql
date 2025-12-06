-- String functions with systematic type combinations

-- LENGTH with all types
SELECT LENGTH(123) AS result;
SELECT LENGTH(123.456) AS result;
SELECT LENGTH("abc") AS result;
SELECT LENGTH("") AS result;
SELECT LENGTH(NULL) AS result;
SELECT LENGTH(TRUE) AS result;
SELECT LENGTH(FALSE) AS result;

-- LOWER with all types
SELECT LOWER(123) AS result;
SELECT LOWER(123.456) AS result;
SELECT LOWER("ABC") AS result;
SELECT LOWER("abc") AS result;
SELECT LOWER("") AS result;
SELECT LOWER(NULL) AS result;
SELECT LOWER(TRUE) AS result;
SELECT LOWER(FALSE) AS result;

-- UPPER with all types
SELECT UPPER(123) AS result;
SELECT UPPER(123.456) AS result;
SELECT UPPER("abc") AS result;
SELECT UPPER("ABC") AS result;
SELECT UPPER("") AS result;
SELECT UPPER(NULL) AS result;
SELECT UPPER(TRUE) AS result;
SELECT UPPER(FALSE) AS result;

-- TRIM with all types
SELECT TRIM(123) AS result;
SELECT TRIM(123.456) AS result;
SELECT TRIM("  abc  ") AS result;
SELECT TRIM("abc") AS result;
SELECT TRIM("") AS result;
SELECT TRIM(NULL) AS result;
SELECT TRIM("  ") AS result;

-- LTRIM with all types
SELECT LTRIM(123) AS result;
SELECT LTRIM(123.456) AS result;
SELECT LTRIM("  abc") AS result;
SELECT LTRIM("abc") AS result;
SELECT LTRIM("") AS result;
SELECT LTRIM(NULL) AS result;

-- RTRIM with all types
SELECT RTRIM(123) AS result;
SELECT RTRIM(123.456) AS result;
SELECT RTRIM("abc  ") AS result;
SELECT RTRIM("abc") AS result;
SELECT RTRIM("") AS result;
SELECT RTRIM(NULL) AS result;

-- REVERSE with all types
SELECT REVERSE(123) AS result;
SELECT REVERSE(123.456) AS result;
SELECT REVERSE("abc") AS result;
SELECT REVERSE("") AS result;
SELECT REVERSE(NULL) AS result;
SELECT REVERSE(TRUE) AS result;

-- CHAR_LENGTH with all types
SELECT CHAR_LENGTH(123) AS result;
SELECT CHAR_LENGTH(123.456) AS result;
SELECT CHAR_LENGTH("abc") AS result;
SELECT CHAR_LENGTH("") AS result;
SELECT CHAR_LENGTH(NULL) AS result;
SELECT CHAR_LENGTH("hello world") AS result;

-- INSTR with type combinations
SELECT INSTR(123456, 34) AS result;
SELECT INSTR(123456, "34") AS result;
SELECT INSTR("123456", 34) AS result;
SELECT INSTR("123456", "34") AS result;
SELECT INSTR(123.456, 4) AS result;
SELECT INSTR("hello world", "world") AS result;
SELECT INSTR("hello world", "o") AS result;
SELECT INSTR("hello world", "") AS result;
SELECT INSTR("", "a") AS result;
SELECT INSTR(NULL, "a") AS result;
SELECT INSTR("hello", NULL) AS result;

-- ASCII with all types
SELECT ASCII(65) AS result;
SELECT ASCII(65.5) AS result;
SELECT ASCII("A") AS result;
SELECT ASCII("ABC") AS result;
SELECT ASCII("") AS result;
SELECT ASCII(NULL) AS result;
SELECT ASCII("0") AS result;
SELECT ASCII(" ") AS result;

-- ORD with all types
SELECT ORD(65) AS result;
SELECT ORD(65.5) AS result;
SELECT ORD("A") AS result;
SELECT ORD("ABC") AS result;
SELECT ORD("") AS result;
SELECT ORD(NULL) AS result;

-- SPACE with type combinations
SELECT SPACE(0) AS result;
SELECT SPACE(5) AS result;
SELECT SPACE(10) AS result;
SELECT SPACE(1.5) AS result;
SELECT SPACE("5") AS result;
SELECT SPACE(NULL) AS result;
SELECT SPACE(-1) AS result;

-- HEX with all types
SELECT HEX(0) AS result;
SELECT HEX(255) AS result;
SELECT HEX(256) AS result;
SELECT HEX(1.5) AS result;
SELECT HEX("hello") AS result;
SELECT HEX("") AS result;
SELECT HEX(NULL) AS result;
SELECT HEX(-1) AS result;
SELECT HEX(TRUE) AS result;
SELECT HEX(FALSE) AS result;

-- UNHEX with type combinations
SELECT UNHEX("48656C6C6F") AS result;
SELECT UNHEX("FF") AS result;
SELECT UNHEX("00") AS result;
SELECT UNHEX("") AS result;
SELECT UNHEX(NULL) AS result;
SELECT UNHEX("G") AS result;
SELECT UNHEX("4865") AS result;
SELECT UNHEX(123) AS result;

-- ABS with all types
SELECT ABS(5) AS result;
SELECT ABS(-5) AS result;
SELECT ABS(5.5) AS result;
SELECT ABS(-5.5) AS result;
SELECT ABS("5") AS result;
SELECT ABS("-5") AS result;
SELECT ABS("abc") AS result;
SELECT ABS("") AS result;
SELECT ABS(NULL) AS result;
SELECT ABS(0) AS result;
SELECT ABS(TRUE) AS result;
SELECT ABS(FALSE) AS result;

-- CEIL with all types
SELECT CEIL(1) AS result;
SELECT CEIL(1.1) AS result;
SELECT CEIL(1.9) AS result;
SELECT CEIL(-1.1) AS result;
SELECT CEIL(-1.9) AS result;
SELECT CEIL("1.5") AS result;
SELECT CEIL("abc") AS result;
SELECT CEIL("") AS result;
SELECT CEIL(NULL) AS result;
SELECT CEIL(0) AS result;

-- FLOOR with all types
SELECT FLOOR(1) AS result;
SELECT FLOOR(1.1) AS result;
SELECT FLOOR(1.9) AS result;
SELECT FLOOR(-1.1) AS result;
SELECT FLOOR(-1.9) AS result;
SELECT FLOOR("1.5") AS result;
SELECT FLOOR("abc") AS result;
SELECT FLOOR("") AS result;
SELECT FLOOR(NULL) AS result;
SELECT FLOOR(0) AS result;

-- SQRT with all types
SELECT SQRT(4) AS result;
SELECT SQRT(4.0) AS result;
SELECT SQRT(2) AS result;
SELECT SQRT("4") AS result;
SELECT SQRT("abc") AS result;
SELECT SQRT("") AS result;
SELECT SQRT(NULL) AS result;
SELECT SQRT(0) AS result;
SELECT SQRT(-1) AS result;
SELECT SQRT(TRUE) AS result;

-- SIGN with all types
SELECT SIGN(5) AS result;
SELECT SIGN(-5) AS result;
SELECT SIGN(0) AS result;
SELECT SIGN(5.5) AS result;
SELECT SIGN(-5.5) AS result;
SELECT SIGN("5") AS result;
SELECT SIGN("-5") AS result;
SELECT SIGN("abc") AS result;
SELECT SIGN("") AS result;
SELECT SIGN(NULL) AS result;
SELECT SIGN(TRUE) AS result;
SELECT SIGN(FALSE) AS result;

-- BIN with all types
SELECT BIN(0) AS result;
SELECT BIN(1) AS result;
SELECT BIN(10) AS result;
SELECT BIN(255) AS result;
SELECT BIN(1.5) AS result;
SELECT BIN("10") AS result;
SELECT BIN("abc") AS result;
SELECT BIN(NULL) AS result;
SELECT BIN(-1) AS result;
SELECT BIN(TRUE) AS result;

-- OCT with all types
SELECT OCT(0) AS result;
SELECT OCT(8) AS result;
SELECT OCT(10) AS result;
SELECT OCT(64) AS result;
SELECT OCT(1.5) AS result;
SELECT OCT("10") AS result;
SELECT OCT("abc") AS result;
SELECT OCT(NULL) AS result;
SELECT OCT(-1) AS result;

-- DEGREES with all types
SELECT DEGREES(0) AS result;
SELECT DEGREES(1) AS result;
SELECT ROUND(DEGREES(3.14159265359),8) AS result;
SELECT DEGREES("1") AS result;
SELECT DEGREES("abc") AS result;
SELECT DEGREES("") AS result;
SELECT DEGREES(NULL) AS result;

-- RADIANS with all types
SELECT RADIANS(0) AS result;
SELECT RADIANS(90) AS result;
SELECT RADIANS(180) AS result;
SELECT RADIANS("90") AS result;
SELECT RADIANS("abc") AS result;
SELECT RADIANS("") AS result;
SELECT RADIANS(NULL) AS result;

-- EXP with all types
SELECT EXP(0) AS result;
SELECT EXP(1) AS result;
SELECT EXP(2) AS result;
SELECT EXP("1") AS result;
SELECT EXP("abc") AS result;
SELECT EXP("") AS result;
SELECT EXP(NULL) AS result;

-- LN with all types
SELECT LN(1) AS result;
SELECT LN(2.718281828459045) AS result;
SELECT LN(10) AS result;
SELECT LN("10") AS result;
SELECT LN("abc") AS result;
SELECT LN("") AS result;
SELECT LN(NULL) AS result;
SELECT LN(0) AS result;
SELECT LN(-1) AS result;

-- LOG with all types (1 arg)
SELECT LOG(1) AS result;
SELECT LOG(10) AS result;
SELECT LOG(100) AS result;
SELECT LOG("10") AS result;
SELECT LOG("abc") AS result;
SELECT LOG("") AS result;
SELECT LOG(NULL) AS result;
SELECT LOG(0) AS result;
SELECT LOG(-1) AS result;

-- LOG with all types (2 args)
SELECT LOG(2, 8) AS result;
SELECT LOG(2, "8") AS result;
SELECT LOG("2", 8) AS result;
SELECT LOG("2", "8") AS result;
SELECT LOG(2.0, 8.0) AS result;
SELECT LOG(10, 100) AS result;
SELECT LOG(2, 0) AS result;
SELECT LOG(0, 8) AS result;
SELECT LOG(NULL, 8) AS result;
SELECT LOG(2, NULL) AS result;

-- LOG2 with all types
SELECT LOG2(1) AS result;
SELECT LOG2(2) AS result;
SELECT LOG2(8) AS result;
SELECT LOG2("8") AS result;
SELECT LOG2("abc") AS result;
SELECT LOG2("") AS result;
SELECT LOG2(NULL) AS result;
SELECT LOG2(0) AS result;
SELECT LOG2(-1) AS result;

-- LOG10 with all types
SELECT LOG10(1) AS result;
SELECT LOG10(10) AS result;
SELECT LOG10(100) AS result;
SELECT LOG10("100") AS result;
SELECT LOG10("abc") AS result;
SELECT LOG10("") AS result;
SELECT LOG10(NULL) AS result;
SELECT LOG10(0) AS result;
SELECT LOG10(-1) AS result;

-- Trigonometric functions with all types
SELECT COS(0) AS result;
SELECT COS(3.14159265359) AS result;
SELECT COS("0") AS result;
SELECT COS("abc") AS result;
SELECT COS(NULL) AS result;

SELECT SIN(0) AS result;
SELECT SIN(1.5707963267949) AS result;
SELECT SIN("0") AS result;
SELECT SIN("abc") AS result;
SELECT SIN(NULL) AS result;

SELECT TAN(0) AS result;
SELECT TAN(0.785398163397448) AS result;
SELECT TAN("0") AS result;
SELECT TAN("abc") AS result;
SELECT TAN(NULL) AS result;

SELECT ACOS(0) AS result;
SELECT ACOS(1) AS result;
SELECT ACOS("0") AS result;
SELECT ACOS("abc") AS result;
SELECT ACOS(2) AS result;
SELECT ACOS(NULL) AS result;

SELECT ASIN(0) AS result;
SELECT ASIN(1) AS result;
SELECT ASIN("0") AS result;
SELECT ASIN("abc") AS result;
SELECT ASIN(2) AS result;
SELECT ASIN(NULL) AS result;

SELECT ATAN(0) AS result;
SELECT ATAN(1) AS result;
SELECT ATAN("0") AS result;
SELECT ATAN("abc") AS result;
SELECT ATAN(NULL) AS result;

SELECT ATAN2(0, 1) AS result;
SELECT ATAN2(1, 1) AS result;
SELECT ATAN2("0", 1) AS result;
SELECT ATAN2(0, "1") AS result;
SELECT ATAN2("0", "1") AS result;
SELECT ATAN2("abc", 1) AS result;
SELECT ATAN2(0, "abc") AS result;
SELECT ATAN2(NULL, 1) AS result;
SELECT ATAN2(0, NULL) AS result;

SELECT COT(0.785398163397448) AS result;
SELECT COT("0.785398163397448") AS result;
SELECT COT("abc") AS result;
SELECT COT(NULL) AS result;
SELECT COT(0) AS result;
