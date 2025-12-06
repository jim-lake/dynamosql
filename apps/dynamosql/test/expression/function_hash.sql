-- Hash function tests
SELECT MD5('test') AS md5_test;
SELECT MD5('') AS md5_empty;
SELECT MD5(NULL) AS md5_null;
SELECT MD5(123) AS md5_number;

SELECT SHA1('test') AS sha1_test;
SELECT SHA('test') AS sha_alias;
SELECT SHA1('') AS sha1_empty;
SELECT SHA1(NULL) AS sha1_null;

SELECT SHA2('test', 224) AS sha2_224;
SELECT SHA2('test', 256) AS sha2_256;
SELECT SHA2('test', 384) AS sha2_384;
SELECT SHA2('test', 512) AS sha2_512;
SELECT SHA2('test', 999) AS sha2_invalid;
SELECT SHA2(NULL, 256) AS sha2_null;
SELECT SHA2('test', NULL) AS sha2_null_bits;

SELECT TO_BASE64('test') AS to_base64_test;
SELECT TO_BASE64('') AS to_base64_empty;
SELECT TO_BASE64(NULL) AS to_base64_null;
SELECT FROM_BASE64('dGVzdA==') AS from_base64_test;
SELECT FROM_BASE64(TO_BASE64('hello')) AS base64_roundtrip;
SELECT FROM_BASE64(NULL) AS from_base64_null;
