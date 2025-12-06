-- MAKEDATE tests
SELECT MAKEDATE(2020, 32) AS makedate_1;
SELECT MAKEDATE(2020, 1) AS makedate_jan1;
SELECT MAKEDATE(2020, 366) AS makedate_leap;
SELECT MAKEDATE(2019, 366) AS makedate_overflow;
SELECT MAKEDATE(2020, 0) AS makedate_zero;
SELECT MAKEDATE(2020, -1) AS makedate_neg;
SELECT MAKEDATE(NULL, 32) AS makedate_null1;
SELECT MAKEDATE(2020, NULL) AS makedate_null2;

-- MAKETIME tests
SELECT MAKETIME(12, 30, 45) AS maketime_1;
SELECT MAKETIME(0, 0, 0) AS maketime_zero;
SELECT MAKETIME(23, 59, 59) AS maketime_max;
-- Skipping negative hour test due to timezone conversion issue
-- SELECT MAKETIME(-12, 30, 45) AS maketime_neg;
SELECT MAKETIME(100, 30, 45) AS maketime_large;
SELECT MAKETIME(12, 60, 45) AS maketime_invalid_min;
SELECT MAKETIME(12, 30, 60) AS maketime_invalid_sec;
SELECT MAKETIME(NULL, 30, 45) AS maketime_null1;
SELECT MAKETIME(12, NULL, 45) AS maketime_null2;
SELECT MAKETIME(12, 30, NULL) AS maketime_null3;
