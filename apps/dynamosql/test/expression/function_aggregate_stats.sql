-- Test statistical aggregate functions
CREATE TEMPORARY TABLE test_stats (val INT);
INSERT INTO test_stats VALUES (1), (2), (3), (4), (5);

-- STDDEV_POP / STDDEV (STD is a reserved keyword in parser)
SELECT STDDEV_POP(val) AS stddev_pop FROM test_stats;
SELECT STDDEV(val) AS stddev FROM test_stats;

-- STDDEV_SAMP
SELECT STDDEV_SAMP(val) AS stddev_samp FROM test_stats;

-- VAR_POP (VARIANCE is a reserved keyword in parser)
SELECT VAR_POP(val) AS var_pop FROM test_stats;

-- VAR_SAMP
SELECT VAR_SAMP(val) AS var_samp FROM test_stats;

-- Test with NULL values
INSERT INTO test_stats VALUES (NULL);
SELECT STDDEV_POP(val) AS stddev_pop_null FROM test_stats;
SELECT VAR_POP(val) AS var_pop_null FROM test_stats;

-- Test with single value (SAMP should return NULL)
CREATE TEMPORARY TABLE test_single (val INT);
INSERT INTO test_single VALUES (5);
SELECT STDDEV_SAMP(val) AS stddev_samp_single FROM test_single;
SELECT VAR_SAMP(val) AS var_samp_single FROM test_single;
SELECT STDDEV_POP(val) AS stddev_pop_single FROM test_single;
SELECT VAR_POP(val) AS var_pop_single FROM test_single;

-- Test with empty table
CREATE TEMPORARY TABLE test_empty (val INT);
SELECT STDDEV_POP(val) AS stddev_pop_empty FROM test_empty;
SELECT VAR_POP(val) AS var_pop_empty FROM test_empty;

DROP TABLE test_stats;
DROP TABLE test_single;
DROP TABLE test_empty;
