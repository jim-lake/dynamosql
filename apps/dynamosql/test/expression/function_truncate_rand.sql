-- TRUNCATE tests
SELECT TRUNCATE(1.999, 1) AS truncate_1;
SELECT TRUNCATE(1.999, 0) AS truncate_0;
SELECT TRUNCATE(1.999, 2) AS truncate_2;
SELECT TRUNCATE(-1.999, 1) AS truncate_neg;
SELECT TRUNCATE(122, -2) AS truncate_neg_dec;
SELECT TRUNCATE(10.28, 1) AS truncate_simple;
SELECT TRUNCATE(10.28*100, 0) AS truncate_expr;
SELECT TRUNCATE(NULL, 1) AS truncate_null;
SELECT TRUNCATE(1.999, NULL) AS truncate_null_dec;

-- RAND tests (check range only, not exact values)
SELECT RAND() >= 0 AND RAND() <= 1 AS rand_range;
SELECT RAND(1) >= 0 AND RAND(1) <= 1 AS rand_seed_range;
SELECT RAND(1) = RAND(1) AS rand_seed_same;
SELECT RAND(2) != RAND(3) AS rand_seed_diff;
SELECT RAND(NULL) >= 0 AND RAND(NULL) <= 1 AS rand_null;
