-- User variables - SET and SELECT
SET @myvar = 10;
SELECT @myvar AS result;
SET @myvar = 20;
SELECT @myvar AS result;
SET @myvar = 2.0;
SELECT @myvar AS result;
SET @myvar = 2.5;
SELECT @myvar AS result;
SET @myvar = "1"/2;
SELECT @myvar AS result;
SET @myvar = NOW();
SELECT @myvar AS ignore_seconds;
SET @myvar = CURDATE();
SELECT @myvar AS ignore_seconds;
SET @myvar = CURTIME();
SELECT @myvar AS ignore_seconds;
SET @str = "hello";
SELECT @str AS result;
SET @null_var = NULL;
SELECT @null_var AS result;

-- Multiple variables
SET @a = 1, @b = 2, @c = 3;
SELECT @a AS a, @b AS b, @c AS c;

-- Variables in expressions
SET @x = 10;
SELECT @x + 5 AS result;
SELECT @x * 2 AS result;
SELECT @x - 3 AS result;

SET @name = "test";
SELECT CONCAT(@name, " value") AS result;

SET @bigname = 222222222222222222;
SELECT @bigname AS result;

-- Variables in calculations
SET @base = 100;
SET @multiplier = 2;
SELECT @base * @multiplier AS result;

-- Undefined variables (should be NULL)
SELECT @undefined_var AS result;

-- SET with SELECT subquery
USE _dynamodb;
SET @result = (SELECT 42);
SELECT @result AS value;

-- System variables
SET @@session.time_zone = "+00:00";
SELECT @@time_zone AS tz;

SET @@session.collation_connection = "utf8mb4_general_ci";
SELECT @@collation_connection AS collation;

SET @@session.div_precision_increment = 8;
SELECT @@div_precision_increment AS div_prec;

SET @@session.sql_mode = "STRICT_TRANS_TABLES";
SELECT @@sql_mode AS mode;

SET @@session.timestamp = 1234567890;
SELECT @@timestamp AS ts;

SET @@session.last_insert_id = 999;
SELECT @@last_insert_id AS last_id;

SET @@session.insert_id = 888;
SELECT @@insert_id AS ins_id;

-- Global variables
SET @@global.time_zone = "+00:00";
SELECT @@global.time_zone AS tz;

SET @@global.collation_connection = "utf8mb4_general_ci";
SELECT @@global.collation_connection AS collation;

SET @@global.div_precision_increment = 10;
SELECT @@global.div_precision_increment AS div_prec;

SET @@global.sql_mode = "TRADITIONAL";

SELECT @@global.system_time_zone IS NOT NULL AS has_system_tz;

-- Invalid SET syntax (should error)
SET invalid_syntax;
