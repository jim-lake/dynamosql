-- Test statistical aggregate functions
CREATE DATABASE IF NOT EXISTS fn_agg_stats;
CREATE TEMPORARY TABLE fn_agg_stats.test_stats (id INT PRIMARY KEY, val INT);
INSERT INTO fn_agg_stats.test_stats (id, val) VALUES (1, 1), (2, 2), (3, 3), (4, 4), (5, 5);

-- STDDEV_POP / STDDEV
SELECT STDDEV_POP(val) AS stddev_pop FROM fn_agg_stats.test_stats;
SELECT STDDEV(val) AS stddev FROM fn_agg_stats.test_stats;

-- STDDEV_SAMP
SELECT STDDEV_SAMP(val) AS stddev_samp FROM fn_agg_stats.test_stats;

-- VAR_POP
SELECT VAR_POP(val) AS var_pop FROM fn_agg_stats.test_stats;

-- VAR_SAMP
SELECT VAR_SAMP(val) AS var_samp FROM fn_agg_stats.test_stats;

-- Test with NULL values (NULL rows are skipped)
INSERT INTO fn_agg_stats.test_stats (id, val) VALUES (6, NULL);
SELECT STDDEV_POP(val) AS stddev_pop_null FROM fn_agg_stats.test_stats;
SELECT VAR_POP(val) AS var_pop_null FROM fn_agg_stats.test_stats;

-- Test with single value (SAMP should return NULL)
CREATE TEMPORARY TABLE fn_agg_stats.test_single (id INT PRIMARY KEY, val INT);
INSERT INTO fn_agg_stats.test_single (id, val) VALUES (1, 5);
SELECT STDDEV_SAMP(val) AS stddev_samp_single FROM fn_agg_stats.test_single;
SELECT VAR_SAMP(val) AS var_samp_single FROM fn_agg_stats.test_single;
SELECT STDDEV_POP(val) AS stddev_pop_single FROM fn_agg_stats.test_single;
SELECT VAR_POP(val) AS var_pop_single FROM fn_agg_stats.test_single;

-- Test with empty table
CREATE TEMPORARY TABLE fn_agg_stats.test_empty (id INT PRIMARY KEY, val INT);
SELECT STDDEV_POP(val) AS stddev_pop_empty FROM fn_agg_stats.test_empty;
SELECT VAR_POP(val) AS var_pop_empty FROM fn_agg_stats.test_empty;
SELECT STDDEV_SAMP(val) AS stddev_samp_empty FROM fn_agg_stats.test_empty;
SELECT VAR_SAMP(val) AS var_samp_empty FROM fn_agg_stats.test_empty;

-- Statistical aggregates with WHERE, GROUP BY and HAVING
SELECT VAR_POP(val) AS var_pop_none FROM fn_agg_stats.test_stats WHERE id > 100;
SELECT id % 2 AS grp, VAR_POP(val) AS var_grp FROM fn_agg_stats.test_stats GROUP BY id % 2 ORDER BY 1;
SELECT STDDEV_POP(val) AS sd FROM fn_agg_stats.test_stats HAVING STDDEV_POP(val) > 1;
