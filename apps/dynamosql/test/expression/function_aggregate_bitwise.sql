-- Test bitwise aggregate functions
CREATE TEMPORARY TABLE test_bits (val INT);
INSERT INTO test_bits VALUES (1), (3), (5), (7);

-- BIT_AND (1 & 3 & 5 & 7 = 1)
SELECT BIT_AND(val) AS bit_and FROM test_bits;

-- BIT_OR (1 | 3 | 5 | 7 = 7)
SELECT BIT_OR(val) AS bit_or FROM test_bits;

-- BIT_XOR (1 ^ 3 ^ 5 ^ 7 = 0)
SELECT BIT_XOR(val) AS bit_xor FROM test_bits;

-- Test with NULL values
INSERT INTO test_bits VALUES (NULL);
SELECT BIT_AND(val) AS bit_and_null FROM test_bits;
SELECT BIT_OR(val) AS bit_or_null FROM test_bits;
SELECT BIT_XOR(val) AS bit_xor_null FROM test_bits;

-- Test with all zeros
CREATE TEMPORARY TABLE test_zeros (val INT);
INSERT INTO test_zeros VALUES (0), (0), (0);
SELECT BIT_AND(val) AS bit_and_zero FROM test_zeros;
SELECT BIT_OR(val) AS bit_or_zero FROM test_zeros;
SELECT BIT_XOR(val) AS bit_xor_zero FROM test_zeros;

-- Test with negative values
CREATE TEMPORARY TABLE test_neg (val INT);
INSERT INTO test_neg VALUES (-1), (5);
SELECT BIT_AND(val) AS bit_and_neg FROM test_neg;
SELECT BIT_OR(val) AS bit_or_neg FROM test_neg;

-- Test with empty table
CREATE TEMPORARY TABLE test_empty (val INT);
SELECT BIT_AND(val) AS bit_and_empty FROM test_empty;
SELECT BIT_OR(val) AS bit_or_empty FROM test_empty;
SELECT BIT_XOR(val) AS bit_xor_empty FROM test_empty;

DROP TABLE test_bits;
DROP TABLE test_zeros;
DROP TABLE test_neg;
DROP TABLE test_empty;
