-- Test SCHEMA alias
SELECT SCHEMA() AS schema_test;

-- Test ISNULL function
SELECT ISNULL(NULL) AS isnull_null;
SELECT ISNULL(0) AS isnull_zero;
SELECT ISNULL(123) AS isnull_number;

-- Test LOCALTIME and LOCALTIMESTAMP
SELECT LOCALTIME() IS NOT NULL AS localtime_test;
SELECT LOCALTIMESTAMP() IS NOT NULL AS localtimestamp_test;

-- Test SPACE function
SELECT SPACE(5) AS space_5;
SELECT SPACE(0) AS space_0;
SELECT LENGTH(SPACE(10)) AS space_length;

-- Test BIN function
SELECT BIN(12) AS bin_12;
SELECT BIN(255) AS bin_255;

-- Test OCT function
SELECT OCT(12) AS oct_12;
SELECT OCT(255) AS oct_255;

-- Test HEX function with numbers
SELECT HEX(255) AS hex_255;
SELECT HEX(16) AS hex_16;

-- Test PI function
SELECT PI() > 3.14 AS pi_test;
SELECT ROUND(PI(), 2) AS pi_rounded;

-- Test DEGREES and RADIANS
SELECT ROUND(DEGREES(PI()), 0) AS degrees_pi;
SELECT ROUND(RADIANS(180), 2) AS radians_180;

-- Test EXP and LN
SELECT ROUND(EXP(1), 2) AS exp_1;
SELECT ROUND(LN(EXP(1)), 2) AS ln_e;

-- Test LOG functions
SELECT ROUND(LOG(10), 2) AS log_10;
SELECT ROUND(LOG(2, 8), 2) AS log_2_8;
SELECT ROUND(LOG2(8), 2) AS log2_8;
SELECT ROUND(LOG10(100), 2) AS log10_100;

-- Test trigonometric functions
SELECT ROUND(COS(0), 2) AS cos_0;
SELECT ROUND(SIN(0), 2) AS sin_0;
SELECT ROUND(TAN(0), 2) AS tan_0;
SELECT ROUND(ACOS(1), 2) AS acos_1;
SELECT ROUND(ASIN(0), 2) AS asin_0;
SELECT ROUND(ATAN(0), 2) AS atan_0;
SELECT ROUND(ATAN2(0, 1), 2) AS atan2_0_1;
SELECT ROUND(COT(PI()/4), 2) AS cot_pi_4;

