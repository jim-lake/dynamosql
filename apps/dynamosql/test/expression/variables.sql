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

-- Variables with queries (removed - requires subquery support)

-- Variables in calculations
SET @base = 100;
SET @multiplier = 2;
SELECT @base * @multiplier AS result;

-- Undefined variables (should be NULL)
SELECT @undefined_var AS result;

-- System variables (read-only)
SELECT @@version_comment AS result;
SELECT @@max_allowed_packet AS result;
