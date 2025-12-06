-- Arithmetic operators with all type combinations
-- Types: int, float, double, string, date, datetime, time, null

-- Addition (+)
SELECT 1 + 2 AS result;
SELECT 1 + 1.5 AS result;
SELECT 1 + 1.123456789 AS result;
SELECT 1 + "2" AS result;
SELECT 1 + "abc" AS result;
SELECT 1 + "" AS result;
SELECT 1 + NULL AS result;

SELECT 1.5 + 2 AS result;
SELECT 1.5 + 2.5 AS result;
SELECT 1.5 + 2.123456789 AS result;
SELECT 1.5 + "2" AS result;
SELECT 1.5 + "abc" AS result;
SELECT 1.5 + NULL AS result;

SELECT 1.123456789 + 2 AS result;
SELECT 1.123456789 + 2.5 AS result;
SELECT ROUND(1.123456789 + 2.987654321, 8) AS result;
SELECT 1.123456789 + "2" AS result;
SELECT 1.123456789 + NULL AS result;

SELECT "1" + 2 AS result;
SELECT "1" + 2.5 AS result;
SELECT "1" + "2" AS result;
SELECT "1" + "abc" AS result;
SELECT "1" + NULL AS result;
SELECT "abc" + 1 AS result;
SELECT "abc" + "def" AS result;
SELECT "" + 1 AS result;

SELECT NULL + 1 AS result;
SELECT NULL + 1.5 AS result;
SELECT NULL + "1" AS result;
SELECT NULL + NULL AS result;

-- Subtraction (-)
SELECT 5 - 2 AS result;
SELECT 5 - 1.5 AS result;
SELECT 5 - 1.123456789 AS result;
SELECT 5 - "2" AS result;
SELECT 5 - "abc" AS result;
SELECT 5 - NULL AS result;

SELECT 5.5 - 2 AS result;
SELECT 5.5 - 2.5 AS result;
SELECT 5.5 - 2.123456789 AS result;
SELECT 5.5 - "2" AS result;
SELECT 5.5 - NULL AS result;

SELECT ROUND(5.123456789 - 2, 8) AS result;
SELECT ROUND(5.123456789 - 2.5, 8) AS result;
SELECT ROUND(5.123456789 - 2.987654321, 8) AS result;
SELECT 5.123456789 - "2" AS result;
SELECT 5.123456789 - NULL AS result;

SELECT "5" - 2 AS result;
SELECT "5" - 2.5 AS result;
SELECT "5" - "2" AS result;
SELECT "5" - "abc" AS result;
SELECT "5" - NULL AS result;
SELECT "abc" - 1 AS result;

SELECT NULL - 1 AS result;
SELECT NULL - NULL AS result;

-- Multiplication (*)
SELECT 3 * 4 AS result;
SELECT 3 * 4.5 AS result;
SELECT 3 * 4.123456789 AS result;
SELECT 3 * "4" AS result;
SELECT 3 * "abc" AS result;
SELECT 3 * NULL AS result;

SELECT 3.5 * 4 AS result;
SELECT 3.5 * 4.5 AS result;
SELECT ROUND(3.5 * 4.123456789, 8) AS result;
SELECT 3.5 * "4" AS result;
SELECT 3.5 * NULL AS result;

SELECT 3.123456789 * 4 AS result;
SELECT 3.123456789 * 4.5 AS result;
SELECT 3.123456789 * 4.987654321 AS result;
SELECT 3.123456789 * "4" AS result;
SELECT 3.123456789 * NULL AS result;

SELECT "3" * 4 AS result;
SELECT "3" * 4.5 AS result;
SELECT "3" * "4" AS result;
SELECT "3" * "abc" AS result;
SELECT "3" * NULL AS result;
SELECT "abc" * 2 AS result;

SELECT NULL * 1 AS result;
SELECT NULL * NULL AS result;

-- Division (/)
SELECT 10 / 2 AS result;
SELECT 10 / 2.5 AS result;
SELECT ROUND(10 / 2.123456789, 8) AS result;
SELECT 10 / "2" AS result;
SELECT 10 / "abc" AS result;
SELECT 10 / 0 AS result;
SELECT 10 / NULL AS result;

SELECT 10.5 / 2 AS result;
SELECT 10.5 / 2.5 AS result;
SELECT ROUND(10.5 / 2.123456789, 8) AS result;
SELECT 10.5 / "2" AS result;
SELECT 10.5 / 0 AS result;
SELECT 10.5 / NULL AS result;

SELECT 10.123456789 / 2 AS result;
SELECT 10.123456789 / 2.5 AS result;
SELECT ROUND(10.123456789 / 2.987654321, 8) AS result;
SELECT 10.123456789 / "2" AS result;
SELECT 10.123456789 / 0 AS result;
SELECT 10.123456789 / NULL AS result;

SELECT "10" / 2 AS result;
SELECT "10" / 2.5 AS result;
SELECT "10" / "2" AS result;
SELECT "10" / "abc" AS result;
SELECT "10" / 0 AS result;
SELECT "10" / NULL AS result;
SELECT "abc" / 2 AS result;

SELECT NULL / 1 AS result;
SELECT NULL / 0 AS result;
SELECT NULL / NULL AS result;

-- Modulo (%)
SELECT 10 % 3 AS result;
SELECT 10 % 3.5 AS result;
SELECT 10 % "3" AS result;
SELECT 10 % "abc" AS result;
SELECT 10 % 0 AS result;
SELECT 10 % NULL AS result;

SELECT 10.5 % 3 AS result;
SELECT 10.5 % 3.5 AS result;
SELECT 10.5 % "3" AS result;
SELECT 10.5 % 0 AS result;
SELECT 10.5 % NULL AS result;

SELECT "10" % 3 AS result;
SELECT "10" % "3" AS result;
SELECT "10" % "abc" AS result;
SELECT "10" % 0 AS result;
SELECT "10" % NULL AS result;

SELECT NULL % 3 AS result;
SELECT NULL % NULL AS result;

-- Unary minus
SELECT -1 AS result;
SELECT -1.5 AS result;
SELECT -1.123456789 AS result;
SELECT -"1" AS result;
SELECT -"abc" AS result;
SELECT -NULL AS result;

-- Unary plus
SELECT +1 AS result;
SELECT +1.5 AS result;
SELECT +"1" AS result;
SELECT +"abc" AS result;
SELECT +NULL AS result;

-- Mixed operations
SELECT 1 + 2 * 3 AS result;
SELECT (1 + 2) * 3 AS result;
SELECT 1.5 + 2.5 * 3.5 AS result;
SELECT "1" + "2" * "3" AS result;
SELECT 10 / 2 + 3 AS result;
SELECT 10 / (2 + 3) AS result;
SELECT 10 % 3 + 1 AS result;
SELECT (10 % 3) + 1 AS result;

-- Type coercion edge cases
SELECT 1 + "2.5" AS result;
SELECT 1 + "2.5abc" AS result;
SELECT 1 + "abc2.5" AS result;
SELECT "1.5" + "2.5" AS result;
SELECT "1e2" + 1 AS result;
SELECT "0x10" + 1 AS result;
SELECT TRUE + 1 AS result;
SELECT FALSE + 1 AS result;
SELECT TRUE + FALSE AS result;
SELECT 1 + TRUE AS result;
SELECT 1 + FALSE AS result;
