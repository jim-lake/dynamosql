-- BIT_COUNT() tests
SELECT BIT_COUNT(0) AS bit_count_zero;
SELECT BIT_COUNT(1) AS bit_count_one;
SELECT BIT_COUNT(7) AS bit_count_seven;
SELECT BIT_COUNT(255) AS bit_count_255;
SELECT BIT_COUNT(64) AS bit_count_64;
SELECT BIT_COUNT(-1) AS bit_count_neg1;
SELECT BIT_COUNT(-5) AS bit_count_neg5;
SELECT BIT_COUNT(NULL) AS bit_count_null;
SELECT BIT_COUNT('15') AS bit_count_string;
SELECT BIT_COUNT(3.7) AS bit_count_float;
