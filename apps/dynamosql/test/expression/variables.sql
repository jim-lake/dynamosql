-- User variables - SET and SELECT
SET @myvar = 10;
SELECT @myvar AS result;

SET @myvar = 20;
SELECT @myvar AS result;

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
SET @@global.time_zone = "+00:00";
SET @@global.collation_connection = "utf8_general_ci";
SET @@global.div_precision_increment = 8;
SET @@global.sql_mode = "STRICT_TRANS_TABLES";

-- Invalid SET syntax (should error)
SET invalid_syntax;
