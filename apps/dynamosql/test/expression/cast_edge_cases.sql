-- Test CAST with partial number strings (not in cast.sql)
SELECT CAST("123abc" AS SIGNED) AS partial_number;
SELECT CAST("" AS SIGNED) AS empty_string;

-- Test CAST with large numbers (not in cast.sql)
SELECT CAST("999999999999" AS SIGNED) AS large_number;
SELECT CAST("-999999999999" AS SIGNED) AS large_negative;

-- Test CAST with decimal truncation (not in cast.sql)
SELECT CAST("123.999" AS SIGNED) AS decimal_truncate2;
SELECT CAST("-123.456" AS SIGNED) AS negative_decimal;

-- Test CAST with leap year (not in cast.sql)
SELECT CAST("2024-02-29 12:00:00" AS DATETIME) AS leap_year;

-- Test CAST with invalid datetime (not in cast.sql)
SELECT CAST("invalid" AS DATETIME) AS invalid_datetime;
SELECT CAST("2024-13-01" AS DATE) AS invalid_month;

SELECT CAST(CAST("23:59:59.999999" AS TIME(6)) AS TIME(1)) AS result;
SELECT CAST(CAST("23:59:59.999999" AS TIME(6)) AS TIME) AS result;
SELECT CAST("23:59:59.999999999" AS TIME(6)) AS result;
SELECT CAST("23:59:59.99999" AS TIME(6)) AS result;
SELECT CAST("23:59:59.99999" AS TIME(0)) AS result;
SELECT CAST("23:59:59.99999" AS TIME) AS result;
