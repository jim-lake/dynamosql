-- Test CHARSET()
SELECT CHARSET('test') AS charset_test;
SELECT CHARSET(123) AS charset_num;
SELECT CHARSET(NULL) AS charset_null;

-- Test COLLATION()
SELECT COLLATION('test') AS collation_test;
SELECT COLLATION(123) AS collation_num;
SELECT COLLATION(NULL) AS collation_null;

-- Test BIT_LENGTH()
SELECT BIT_LENGTH('test') AS bit_length_test;
SELECT BIT_LENGTH('') AS bit_length_empty;
SELECT BIT_LENGTH(NULL) AS bit_length_null;
SELECT BIT_LENGTH('hello') AS bit_length_hello;

-- Test SOUNDEX()
SELECT SOUNDEX('Hello') AS soundex_hello;
SELECT SOUNDEX('World') AS soundex_world;
SELECT SOUNDEX('') AS soundex_empty;
SELECT SOUNDEX(NULL) AS soundex_null;
SELECT SOUNDEX('Robert') AS soundex_robert;
SELECT SOUNDEX('Rupert') AS soundex_rupert;

-- Test QUOTE()
SELECT QUOTE('test') AS quote_test;
SELECT QUOTE("Don't") AS quote_apostrophe;
SELECT QUOTE(NULL) AS quote_null;
SELECT QUOTE('') AS quote_empty;
SELECT QUOTE(123) AS quote_num;
