-- Arithmetic operators
SELECT 10 + 5 AS result;
SELECT 10 - 5 AS result;
SELECT 10 * 5 AS result;
SELECT 10 / 5 AS result;
SELECT 10 / 3 AS result;
SELECT 10 / 0 AS result;

-- Negative numbers
SELECT -10 + 5 AS result;
SELECT -10 - 5 AS result;
SELECT -10 * 5 AS result;
SELECT -10 / 5 AS result;

-- Operator precedence
SELECT 2 + 3 * 4 AS result;
SELECT (2 + 3) * 4 AS result;
SELECT 10 - 2 * 3 AS result;
SELECT (10 - 2) * 3 AS result;
SELECT 10 / 2 + 3 AS result;
SELECT 10 / (2 + 3) AS result;

-- Comparison operators
SELECT 5 = 5 AS result;
SELECT 5 = 6 AS result;
SELECT 5 != 5 AS result;
SELECT 5 != 6 AS result;
SELECT 5 <> 5 AS result;
SELECT 5 <> 6 AS result;
SELECT 5 < 6 AS result;
SELECT 5 < 5 AS result;
SELECT 5 < 4 AS result;
SELECT 5 > 4 AS result;
SELECT 5 > 5 AS result;
SELECT 5 > 6 AS result;
SELECT 5 <= 5 AS result;
SELECT 5 <= 6 AS result;
SELECT 5 <= 4 AS result;
SELECT 5 >= 5 AS result;
SELECT 5 >= 4 AS result;
SELECT 5 >= 6 AS result;

-- Logical operators
SELECT TRUE AND TRUE AS result;
SELECT TRUE AND FALSE AS result;
SELECT FALSE AND TRUE AS result;
SELECT FALSE AND FALSE AS result;
SELECT TRUE OR TRUE AS result;
SELECT TRUE OR FALSE AS result;
SELECT FALSE OR TRUE AS result;
SELECT FALSE OR FALSE AS result;
SELECT TRUE XOR TRUE AS result;
SELECT TRUE XOR FALSE AS result;
SELECT FALSE XOR TRUE AS result;
SELECT FALSE XOR FALSE AS result;
SELECT NOT TRUE AS result;
SELECT NOT FALSE AS result;
SELECT !TRUE AS result;
SELECT !FALSE AS result;

-- Logical with NULL
SELECT TRUE AND NULL AS result;
SELECT FALSE AND NULL AS result;
SELECT NULL AND TRUE AS result;
SELECT NULL AND FALSE AS result;
SELECT TRUE OR NULL AS result;
SELECT FALSE OR NULL AS result;
SELECT NULL OR TRUE AS result;
SELECT NULL OR FALSE AS result;
SELECT NOT NULL AS result;

-- Complex logical expressions
SELECT (5 > 3) AND (10 < 20) AS result;
SELECT (5 > 3) OR (10 > 20) AS result;
SELECT (5 > 3) XOR (10 < 20) AS result;
SELECT NOT (5 > 3) AS result;
SELECT (5 > 3) AND NOT (10 > 20) AS result;

-- Arithmetic with columns
SELECT id, other, other + 10 AS plus_ten FROM _dynamodb.foo WHERE other IS NOT NULL ORDER BY id;
SELECT id, other, other - 10 AS minus_ten FROM _dynamodb.foo WHERE other IS NOT NULL ORDER BY id;
SELECT id, other, other * 2 AS doubled FROM _dynamodb.foo WHERE other IS NOT NULL ORDER BY id;
SELECT id, other, other / 2 AS halved FROM _dynamodb.foo WHERE other IS NOT NULL ORDER BY id;

-- Comparison with columns
SELECT id, other FROM _dynamodb.foo WHERE other = 111 ORDER BY id;
SELECT id, other FROM _dynamodb.foo WHERE other != 111 ORDER BY id;
SELECT id, other FROM _dynamodb.foo WHERE other > 200 ORDER BY id;
SELECT id, other FROM _dynamodb.foo WHERE other < 200 ORDER BY id;
SELECT id, other FROM _dynamodb.foo WHERE other >= 222 ORDER BY id;
SELECT id, other FROM _dynamodb.foo WHERE other <= 222 ORDER BY id;
