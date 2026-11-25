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

-- Test CAST AS UNSIGNED with negative and overflow values
SELECT CAST("-1" AS UNSIGNED) AS unsigned_negative_string;
SELECT CAST(-1.5 AS UNSIGNED) AS unsigned_negative_decimal;
SELECT CAST(-1e0 AS UNSIGNED) AS unsigned_negative_double;
SELECT CAST("18446744073709551615" AS UNSIGNED) AS unsigned_max;
SELECT CAST("18446744073709551616" AS UNSIGNED) AS unsigned_overflow_string;
SELECT CAST("-9223372036854775809" AS UNSIGNED) AS unsigned_below_signed_min;
SELECT CAST(-9223372036854775809 AS UNSIGNED) AS unsigned_below_signed_min_literal;
SELECT CAST("123abc" AS UNSIGNED) AS unsigned_partial_number;
SELECT CAST(" 42 " AS UNSIGNED) AS unsigned_padded;
SELECT CAST("1e3" AS UNSIGNED) AS unsigned_exponent_string;

-- Test CAST AS SIGNED with integer literals beyond the signed range
SELECT CAST(9223372036854775808 AS SIGNED) AS signed_literal_wraps;
SELECT CAST(18446744073709551615 AS SIGNED) AS signed_literal_max_wraps;
SELECT CAST(18446744073709551616 AS SIGNED) AS signed_literal_clamps;
SELECT CAST(-9223372036854775809 AS SIGNED) AS signed_literal_below_min;

-- Test CAST AS SIGNED with strings beyond the signed range
SELECT CAST("9223372036854775808" AS SIGNED) AS signed_string_wraps;
SELECT CAST("18446744073709551615" AS SIGNED) AS signed_string_max_wraps;
SELECT CAST("18446744073709551616" AS SIGNED) AS signed_string_above_uint_max_wraps;
SELECT CAST("-9223372036854775809" AS SIGNED) AS signed_string_below_min;
SELECT CAST("-99999999999999999999999" AS SIGNED) AS signed_string_far_below_min;
SELECT CAST("99999999999999999999999" AS SIGNED) AS signed_string_far_above_max;

-- Test CAST AS SIGNED with DOUBLE and DECIMAL values beyond the signed range
SELECT CAST(1e30 AS SIGNED) AS signed_double_clamps;
SELECT CAST(9223372036854775808e0 AS SIGNED) AS signed_double_at_min_boundary;
SELECT CAST(18446744073709551616e0 AS SIGNED) AS signed_double_above_uint_max;
SELECT CAST(-9223372036854775809e0 AS SIGNED) AS signed_double_below_min;
SELECT CAST(18446744073709551615.4 AS SIGNED) AS signed_decimal_clamps;
SELECT CAST(9223372036854775808.5 AS SIGNED) AS signed_decimal_clamps_above_max;
SELECT CAST(-9223372036854775808.5 AS SIGNED) AS signed_decimal_rounds_to_min;
SELECT CAST(-123456789012345678901234567890.0 AS SIGNED) AS signed_decimal_clamps_below_min;

-- Test CAST AS UNSIGNED with integer literals, strings, DOUBLE, and DECIMAL beyond the range
SELECT CAST(-1 AS UNSIGNED) AS unsigned_literal_negative_one;
SELECT CAST(-9223372036854775808 AS UNSIGNED) AS unsigned_literal_signed_min;
SELECT CAST(18446744073709551616 AS UNSIGNED) AS unsigned_literal_clamps;
SELECT CAST("-1" AS UNSIGNED) AS unsigned_string_negative_one;
SELECT CAST("18446744073709551616" AS UNSIGNED) AS unsigned_string_clamps;
SELECT CAST(1e30 AS UNSIGNED) AS unsigned_double_clamps;
SELECT CAST(9223372036854775808e0 AS UNSIGNED) AS unsigned_double_at_signed_boundary;
SELECT CAST(-9223372036854775809e0 AS UNSIGNED) AS unsigned_double_below_min;
SELECT CAST(18446744073709551615.4 AS UNSIGNED) AS unsigned_decimal_clamps;
SELECT CAST(-123456789012345678901234567890.0 AS UNSIGNED) AS unsigned_decimal_clamps_below_min;
