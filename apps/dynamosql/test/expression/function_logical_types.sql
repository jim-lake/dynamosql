-- Logical operators with all type combinations

-- AND with all type combinations
SELECT TRUE AND TRUE AS result;
SELECT TRUE AND FALSE AS result;
SELECT FALSE AND TRUE AS result;
SELECT FALSE AND FALSE AS result;
SELECT 1 AND 1 AS result;
SELECT 1 AND 0 AS result;
SELECT 0 AND 1 AS result;
SELECT 0 AND 0 AS result;
SELECT 1 AND 2 AS result;
SELECT 2 AND 3 AS result;
SELECT -1 AND 1 AS result;
SELECT 1.5 AND 2.5 AS result;
SELECT 0.0 AND 1.0 AS result;
SELECT "1" AND "1" AS result;
SELECT "1" AND "0" AS result;
SELECT "abc" AND "def" AS result;
SELECT "" AND "abc" AS result;
SELECT "" AND "" AS result;
SELECT 1 AND "1" AS result;
SELECT 1 AND "abc" AS result;
SELECT 1 AND "" AS result;
SELECT "1" AND 1 AS result;
SELECT 1.5 AND "1" AS result;
SELECT NULL AND TRUE AS result;
SELECT NULL AND FALSE AS result;
SELECT NULL AND 1 AS result;
SELECT NULL AND 0 AS result;
SELECT NULL AND NULL AS result;
SELECT TRUE AND NULL AS result;
SELECT FALSE AND NULL AS result;
SELECT 1 AND NULL AS result;
SELECT 0 AND NULL AS result;

-- OR with all type combinations
SELECT TRUE OR TRUE AS result;
SELECT TRUE OR FALSE AS result;
SELECT FALSE OR TRUE AS result;
SELECT FALSE OR FALSE AS result;
SELECT 1 OR 1 AS result;
SELECT 1 OR 0 AS result;
SELECT 0 OR 1 AS result;
SELECT 0 OR 0 AS result;
SELECT 1 OR 2 AS result;
SELECT 2 OR 3 AS result;
SELECT -1 OR 1 AS result;
SELECT 1.5 OR 2.5 AS result;
SELECT 0.0 OR 1.0 AS result;
SELECT "1" OR "1" AS result;
SELECT "1" OR "0" AS result;
SELECT "abc" OR "def" AS result;
SELECT "" OR "abc" AS result;
SELECT "" OR "" AS result;
SELECT 1 OR "1" AS result;
SELECT 1 OR "abc" AS result;
SELECT 1 OR "" AS result;
SELECT "1" OR 1 AS result;
SELECT 1.5 OR "1" AS result;
SELECT NULL OR TRUE AS result;
SELECT NULL OR FALSE AS result;
SELECT NULL OR 1 AS result;
SELECT NULL OR 0 AS result;
SELECT NULL OR NULL AS result;
SELECT TRUE OR NULL AS result;
SELECT FALSE OR NULL AS result;
SELECT 1 OR NULL AS result;
SELECT 0 OR NULL AS result;

-- XOR with all type combinations
SELECT TRUE XOR TRUE AS result;
SELECT TRUE XOR FALSE AS result;
SELECT FALSE XOR TRUE AS result;
SELECT FALSE XOR FALSE AS result;
SELECT 1 XOR 1 AS result;
SELECT 1 XOR 0 AS result;
SELECT 0 XOR 1 AS result;
SELECT 0 XOR 0 AS result;
SELECT 1 XOR 2 AS result;
SELECT 2 XOR 3 AS result;
SELECT 1.5 XOR 2.5 AS result;
SELECT "1" XOR "1" AS result;
SELECT "1" XOR "0" AS result;
SELECT "abc" XOR "def" AS result;
SELECT "" XOR "abc" AS result;
SELECT 1 XOR "1" AS result;
SELECT 1 XOR "abc" AS result;
SELECT NULL XOR TRUE AS result;
SELECT NULL XOR FALSE AS result;
SELECT NULL XOR NULL AS result;
SELECT TRUE XOR NULL AS result;
SELECT FALSE XOR NULL AS result;

-- NOT with all types
SELECT NOT TRUE AS result;
SELECT NOT FALSE AS result;
SELECT NOT 1 AS result;
SELECT NOT 0 AS result;
SELECT NOT 2 AS result;
SELECT NOT -1 AS result;
SELECT NOT 1.5 AS result;
SELECT NOT 0.0 AS result;
SELECT NOT "1" AS result;
SELECT NOT "0" AS result;
SELECT NOT "abc" AS result;
SELECT NOT "" AS result;
SELECT NOT NULL AS result;

-- ! operator with all types
SELECT !TRUE AS result;
SELECT !FALSE AS result;
SELECT !1 AS result;
SELECT !0 AS result;
SELECT !2 AS result;
SELECT !-1 AS result;
SELECT !1.5 AS result;
SELECT !0.0 AS result;
SELECT !"1" AS result;
SELECT !"0" AS result;
SELECT !"abc" AS result;
SELECT !"" AS result;
SELECT !NULL AS result;

-- Complex logical expressions
SELECT (1 AND 1) OR 0 AS result;
SELECT 1 AND (1 OR 0) AS result;
SELECT (1 OR 0) AND (1 OR 0) AS result;
SELECT NOT (1 AND 0) AS result;
SELECT NOT (1 OR 0) AS result;
SELECT (NOT 1) AND 1 AS result;
SELECT NOT (NOT 1) AS result;
SELECT 1 AND 1 AND 1 AS result;
SELECT 1 OR 0 OR 0 AS result;
SELECT 1 XOR 0 XOR 1 AS result;

-- Logical with NULL propagation
SELECT (1 AND NULL) OR 1 AS result;
SELECT (1 OR NULL) AND 1 AS result;
SELECT (NULL AND 0) OR 1 AS result;
SELECT (NULL OR 1) AND 1 AS result;
SELECT NOT (NULL AND 1) AS result;
SELECT NOT (NULL OR 0) AS result;

-- Logical with comparisons
SELECT (1 = 1) AND (2 = 2) AS result;
SELECT (1 = 1) OR (2 = 3) AS result;
SELECT (1 < 2) AND (2 < 3) AS result;
SELECT (1 > 2) OR (2 < 3) AS result;
SELECT NOT (1 = 2) AS result;
SELECT (1 = 1) XOR (2 = 2) AS result;
SELECT (1 = 1) XOR (2 = 3) AS result;

-- Logical with string comparisons
SELECT ("a" = "a") AND ("b" = "b") AS result;
SELECT ("a" < "b") AND ("b" < "c") AS result;
SELECT ("a" = "A") OR ("b" = "B") AS result;
SELECT NOT ("a" = "b") AS result;

-- Logical with mixed types in comparisons
SELECT (1 = "1") AND (2 = "2") AS result;
SELECT (1 = "1") OR (2 = "abc") AS result;
SELECT (1.5 = "1.5") AND (2.5 = "2.5") AS result;
SELECT NOT (1 = "abc") AS result;

-- Short-circuit behavior tests
SELECT 0 AND (1/0) AS result;
SELECT 1 OR (1/0) AS result;
SELECT FALSE AND (1/0) AS result;
SELECT TRUE OR (1/0) AS result;
SELECT NULL AND 0 AS result;
SELECT NULL OR 1 AS result;

-- Truthiness tests
SELECT IF(1, "true", "false") AS result;
SELECT IF(0, "true", "false") AS result;
SELECT IF(2, "true", "false") AS result;
SELECT IF(-1, "true", "false") AS result;
SELECT IF(1.5, "true", "false") AS result;
SELECT IF(0.0, "true", "false") AS result;
SELECT IF("1", "true", "false") AS result;
SELECT IF("0", "true", "false") AS result;
SELECT IF("abc", "true", "false") AS result;
SELECT IF("", "true", "false") AS result;
SELECT IF(NULL, "true", "false") AS result;
SELECT IF(TRUE, "true", "false") AS result;
SELECT IF(FALSE, "true", "false") AS result;

-- Logical operators with aggregate results
SELECT (1 > 0) AND (2 > 1) AS result;
SELECT (1 < 0) OR (2 > 1) AS result;
SELECT NOT (1 > 2) AS result;

-- Mixed logical and arithmetic
SELECT (1 + 1 = 2) AND (2 * 2 = 4) AS result;
SELECT (1 + 1 = 3) OR (2 * 2 = 4) AS result;
SELECT NOT (1 + 1 = 3) AS result;
SELECT (1 + 1) AND (2 + 2) AS result;
SELECT (1 - 1) OR (2 - 2) AS result;

-- Logical with string operations
SELECT (CONCAT("a", "b") = "ab") AND (LENGTH("abc") = 3) AS result;
SELECT (UPPER("abc") = "ABC") OR (LOWER("ABC") = "abc") AS result;
SELECT NOT (CONCAT("a", "b") = "ba") AS result;

-- Logical with date operations
SELECT (YEAR("2024-01-15") = 2024) AND (MONTH("2024-01-15") = 1) AS result;
SELECT (DAY("2024-01-15") = 15) OR (DAY("2024-01-15") = 16) AS result;
SELECT NOT (YEAR("2024-01-15") = 2023) AS result;
