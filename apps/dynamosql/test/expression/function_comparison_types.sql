-- Comparison operators with all type combinations
-- Types: int, float, double, string, null, bool

-- Equality (=)
SELECT 1 = 1 AS result;
SELECT 1 = 2 AS result;
SELECT 1 = 1.0 AS result;
SELECT 1 = 1.5 AS result;
SELECT 1 = "1" AS result;
SELECT 1 = "1.0" AS result;
SELECT 1 = "abc" AS result;
SELECT 1 = NULL AS result;
SELECT 1 = TRUE AS result;
SELECT 1 = FALSE AS result;

SELECT 1.5 = 1.5 AS result;
SELECT 1.5 = 1.50 AS result;
SELECT 1.5 = 2.5 AS result;
SELECT 1.5 = 1 AS result;
SELECT 1.5 = "1.5" AS result;
SELECT 1.5 = "abc" AS result;
SELECT 1.5 = NULL AS result;

SELECT "1" = 1 AS result;
SELECT "1" = 1.0 AS result;
SELECT "1" = "1" AS result;
SELECT "1" = "1.0" AS result;
SELECT "1" = "01" AS result;
SELECT "abc" = "abc" AS result;
SELECT "abc" = "ABC" AS result;
SELECT "abc" = 0 AS result;
SELECT "" = 0 AS result;
SELECT "" = "" AS result;
SELECT "1" = NULL AS result;

SELECT NULL = NULL AS result;
SELECT NULL = 0 AS result;
SELECT NULL = "" AS result;

SELECT TRUE = TRUE AS result;
SELECT TRUE = FALSE AS result;
SELECT TRUE = 1 AS result;
SELECT TRUE = 0 AS result;
SELECT FALSE = 0 AS result;
SELECT FALSE = FALSE AS result;

-- Inequality (!=, <>)
SELECT 1 != 2 AS result;
SELECT 1 != 1 AS result;
SELECT 1 != "1" AS result;
SELECT 1 != NULL AS result;
SELECT 1 <> 2 AS result;
SELECT 1 <> 1 AS result;

SELECT 1.5 != 2.5 AS result;
SELECT 1.5 != 1.5 AS result;
SELECT "abc" != "def" AS result;
SELECT "abc" != "abc" AS result;
SELECT NULL != NULL AS result;

-- Less than (<)
SELECT 1 < 2 AS result;
SELECT 2 < 1 AS result;
SELECT 1 < 1 AS result;
SELECT 1 < 1.5 AS result;
SELECT 1.5 < 1 AS result;
SELECT 1 < "2" AS result;
SELECT 1 < "abc" AS result;
SELECT 1 < NULL AS result;

SELECT 1.5 < 2.5 AS result;
SELECT 2.5 < 1.5 AS result;
SELECT 1.5 < 1.5 AS result;
SELECT 1.5 < "2" AS result;
SELECT 1.5 < NULL AS result;

SELECT "1" < "2" AS result;
SELECT "2" < "1" AS result;
SELECT "1" < "10" AS result;
SELECT "10" < "2" AS result;
SELECT "abc" < "def" AS result;
SELECT "abc" < "ABC" AS result;
SELECT "abc" < 1 AS result;
SELECT "" < "a" AS result;
SELECT "" < 0 AS result;
SELECT "1" < NULL AS result;

SELECT NULL < 1 AS result;
SELECT NULL < NULL AS result;

-- Greater than (>)
SELECT 2 > 1 AS result;
SELECT 1 > 2 AS result;
SELECT 1 > 1 AS result;
SELECT 1.5 > 1 AS result;
SELECT 1 > 1.5 AS result;
SELECT 2 > "1" AS result;
SELECT 1 > "abc" AS result;
SELECT 1 > NULL AS result;

SELECT 2.5 > 1.5 AS result;
SELECT 1.5 > 2.5 AS result;
SELECT 1.5 > 1.5 AS result;
SELECT 2.5 > "1" AS result;
SELECT 1.5 > NULL AS result;

SELECT "2" > "1" AS result;
SELECT "1" > "2" AS result;
SELECT "10" > "2" AS result;
SELECT "2" > "10" AS result;
SELECT "def" > "abc" AS result;
SELECT "ABC" > "abc" AS result;
SELECT "a" > "" AS result;
SELECT 1 > "abc" AS result;
SELECT "1" > NULL AS result;

SELECT NULL > 1 AS result;
SELECT NULL > NULL AS result;

-- Less than or equal (<=)
SELECT 1 <= 2 AS result;
SELECT 2 <= 1 AS result;
SELECT 1 <= 1 AS result;
SELECT 1 <= 1.0 AS result;
SELECT 1 <= "1" AS result;
SELECT 1 <= NULL AS result;

SELECT 1.5 <= 2.5 AS result;
SELECT 1.5 <= 1.5 AS result;
SELECT 1.5 <= 1.0 AS result;
SELECT 1.5 <= "2" AS result;
SELECT 1.5 <= NULL AS result;

SELECT "1" <= "2" AS result;
SELECT "1" <= "1" AS result;
SELECT "abc" <= "abc" AS result;
SELECT "abc" <= "def" AS result;
SELECT "1" <= NULL AS result;

SELECT NULL <= 1 AS result;
SELECT NULL <= NULL AS result;

-- Greater than or equal (>=)
SELECT 2 >= 1 AS result;
SELECT 1 >= 2 AS result;
SELECT 1 >= 1 AS result;
SELECT 1 >= 1.0 AS result;
SELECT 1 >= "1" AS result;
SELECT 1 >= NULL AS result;

SELECT 2.5 >= 1.5 AS result;
SELECT 1.5 >= 1.5 AS result;
SELECT 1.0 >= 1.5 AS result;
SELECT 2.5 >= "1" AS result;
SELECT 1.5 >= NULL AS result;

SELECT "2" >= "1" AS result;
SELECT "1" >= "1" AS result;
SELECT "abc" >= "abc" AS result;
SELECT "def" >= "abc" AS result;
SELECT "1" >= NULL AS result;

SELECT NULL >= 1 AS result;
SELECT NULL >= NULL AS result;

-- IS NULL / IS NOT NULL
SELECT 1 IS NULL AS result;
SELECT 1.5 IS NULL AS result;
SELECT "abc" IS NULL AS result;
SELECT "" IS NULL AS result;
SELECT 0 IS NULL AS result;
SELECT NULL IS NULL AS result;

SELECT 1 IS NOT NULL AS result;
SELECT 1.5 IS NOT NULL AS result;
SELECT "abc" IS NOT NULL AS result;
SELECT "" IS NOT NULL AS result;
SELECT 0 IS NOT NULL AS result;
SELECT NULL IS NOT NULL AS result;

-- IN
SELECT 1 IN (1, 2, 3) AS result;
SELECT 4 IN (1, 2, 3) AS result;
SELECT 1 IN (1.0, 2.0, 3.0) AS result;
SELECT 1.5 IN (1, 2, 3) AS result;
SELECT 1.5 IN (1.5, 2.5, 3.5) AS result;
SELECT "1" IN (1, 2, 3) AS result;
SELECT "1" IN ("1", "2", "3") AS result;
SELECT "abc" IN ("abc", "def", "ghi") AS result;
SELECT "abc" IN ("ABC", "DEF", "GHI") AS result;
SELECT NULL IN (1, 2, 3) AS result;
SELECT 1 IN (NULL, 2, 3) AS result;
SELECT 1 IN (NULL, NULL, NULL) AS result;

-- NOT IN
SELECT 1 NOT IN (2, 3, 4) AS result;
SELECT 1 NOT IN (1, 2, 3) AS result;
SELECT "abc" NOT IN ("def", "ghi") AS result;
SELECT "abc" NOT IN ("abc", "def") AS result;
SELECT NULL NOT IN (1, 2, 3) AS result;
SELECT 1 NOT IN (NULL, 2, 3) AS result;

-- LIKE
SELECT "hello" LIKE "hello" AS result;
SELECT "hello" LIKE "Hello" AS result;
SELECT "hello" LIKE "h%" AS result;
SELECT "hello" LIKE "%o" AS result;
SELECT "hello" LIKE "%ll%" AS result;
SELECT "hello" LIKE "h_llo" AS result;
SELECT "hello" LIKE "h__lo" AS result;
SELECT "hello" LIKE "h%o" AS result;
SELECT "hello" LIKE "x%" AS result;
SELECT 123 LIKE "12%" AS result;
SELECT 123 LIKE "%3" AS result;
SELECT "hello" LIKE NULL AS result;
SELECT NULL LIKE "hello" AS result;

-- NOT LIKE
SELECT "hello" NOT LIKE "world" AS result;
SELECT "hello" NOT LIKE "hello" AS result;
SELECT "hello" NOT LIKE "h%" AS result;
SELECT "hello" NOT LIKE "x%" AS result;

-- Mixed comparisons
SELECT 1 = 1 AND 2 = 2 AS result;
SELECT 1 = 1 OR 2 = 3 AS result;
SELECT 1 < 2 AND 2 < 3 AS result;
SELECT 1 < 2 OR 2 > 3 AS result;
SELECT NOT (1 = 2) AS result;
SELECT 1 = 1 AND NULL AS result;
SELECT 1 = 2 OR NULL AS result;
SELECT NULL AND TRUE AS result;
SELECT NULL OR FALSE AS result;

-- Type coercion edge cases
SELECT "1.0" = "1.00" AS result;
SELECT "01" = "1" AS result;
SELECT " 1" = "1" AS result;
SELECT "1 " = "1" AS result;
SELECT "1e2" = 100 AS result;
SELECT "0x10" = 16 AS result;
SELECT TRUE = "1" AS result;
SELECT FALSE = "0" AS result;
SELECT "" = NULL AS result;
SELECT 0 = FALSE AS result;
SELECT 1 = TRUE AS result;
