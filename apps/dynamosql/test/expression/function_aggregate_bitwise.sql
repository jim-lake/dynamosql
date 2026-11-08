-- Test bitwise aggregate functions
CREATE DATABASE IF NOT EXISTS fn_agg_bits;
CREATE TEMPORARY TABLE fn_agg_bits.test_bits (id INT PRIMARY KEY, val INT);
INSERT INTO fn_agg_bits.test_bits (id, val) VALUES (1, 1), (2, 3), (3, 5), (4, 7);

-- BIT_AND (1 & 3 & 5 & 7 = 1)
SELECT BIT_AND(val) AS bit_and FROM fn_agg_bits.test_bits;

-- BIT_OR (1 | 3 | 5 | 7 = 7)
SELECT BIT_OR(val) AS bit_or FROM fn_agg_bits.test_bits;

-- BIT_XOR (1 ^ 3 ^ 5 ^ 7 = 0)
SELECT BIT_XOR(val) AS bit_xor FROM fn_agg_bits.test_bits;

-- Test with NULL values (NULL rows are skipped)
INSERT INTO fn_agg_bits.test_bits (id, val) VALUES (5, NULL);
SELECT BIT_AND(val) AS bit_and_null FROM fn_agg_bits.test_bits;
SELECT BIT_OR(val) AS bit_or_null FROM fn_agg_bits.test_bits;
SELECT BIT_XOR(val) AS bit_xor_null FROM fn_agg_bits.test_bits;

-- Test with all zeros
CREATE TEMPORARY TABLE fn_agg_bits.test_zeros (id INT PRIMARY KEY, val INT);
INSERT INTO fn_agg_bits.test_zeros (id, val) VALUES (1, 0), (2, 0), (3, 0);
SELECT BIT_AND(val) AS bit_and_zero FROM fn_agg_bits.test_zeros;
SELECT BIT_OR(val) AS bit_or_zero FROM fn_agg_bits.test_zeros;
SELECT BIT_XOR(val) AS bit_xor_zero FROM fn_agg_bits.test_zeros;

-- Test with negative values (treated as unsigned 64-bit)
CREATE TEMPORARY TABLE fn_agg_bits.test_neg (id INT PRIMARY KEY, val INT);
INSERT INTO fn_agg_bits.test_neg (id, val) VALUES (1, -1), (2, 5);
SELECT BIT_AND(val) AS bit_and_neg FROM fn_agg_bits.test_neg;
SELECT BIT_OR(val) AS bit_or_neg FROM fn_agg_bits.test_neg;
SELECT BIT_XOR(val) AS bit_xor_neg FROM fn_agg_bits.test_neg;

-- Test with empty table
CREATE TEMPORARY TABLE fn_agg_bits.test_empty (id INT PRIMARY KEY, val INT);
SELECT BIT_AND(val) AS bit_and_empty FROM fn_agg_bits.test_empty;
SELECT BIT_OR(val) AS bit_or_empty FROM fn_agg_bits.test_empty;
SELECT BIT_XOR(val) AS bit_xor_empty FROM fn_agg_bits.test_empty;

-- Bit aggregates with WHERE, GROUP BY, HAVING and expressions
SELECT BIT_OR(val) AS bit_or_none FROM fn_agg_bits.test_bits WHERE id > 100;
SELECT id % 2 AS grp, BIT_OR(val) AS bit_or_grp FROM fn_agg_bits.test_bits GROUP BY id % 2 ORDER BY 1;
SELECT BIT_OR(val) AS bit_or_all FROM fn_agg_bits.test_bits HAVING BIT_OR(val) > 6;
SELECT BIT_AND(val) + 1 AS bit_and_plus FROM fn_agg_bits.test_bits;
