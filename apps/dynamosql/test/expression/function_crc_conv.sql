-- CRC32 tests
SELECT CRC32('test') AS crc32_test;
SELECT CRC32('') AS crc32_empty;
SELECT CRC32(NULL) AS crc32_null;
SELECT CRC32('MySQL') AS crc32_mysql;
SELECT CRC32(123) AS crc32_number;

-- CONV tests
SELECT CONV('FF', 16, 10) AS conv_hex_to_dec;
SELECT CONV('255', 10, 16) AS conv_dec_to_hex;
SELECT CONV('1010', 2, 10) AS conv_bin_to_dec;
SELECT CONV('10', 10, 2) AS conv_dec_to_bin;
SELECT CONV('Z', 36, 10) AS conv_base36;
SELECT CONV('-10', 10, 2) AS conv_negative;
SELECT CONV(NULL, 10, 16) AS conv_null;
SELECT CONV('FF', NULL, 10) AS conv_null_from;
SELECT CONV('FF', 16, NULL) AS conv_null_to;
