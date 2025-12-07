-- INET_ATON tests
SELECT INET_ATON('192.168.1.1') AS inet_aton_basic;
SELECT INET_ATON('10.0.0.1') AS inet_aton_10;
SELECT INET_ATON('255.255.255.255') AS inet_aton_max;
SELECT INET_ATON('0.0.0.0') AS inet_aton_zero;
SELECT INET_ATON('127.0.0.1') AS inet_aton_localhost;
SELECT INET_ATON(NULL) AS inet_aton_null;
SELECT INET_ATON('256.1.1.1') AS inet_aton_invalid;
SELECT INET_ATON('1.1.1') AS inet_aton_short;
SELECT INET_ATON('1.1.1.1.1') AS inet_aton_long;

-- INET_NTOA tests
SELECT INET_NTOA(3232235777) AS inet_ntoa_basic;
SELECT INET_NTOA(167772161) AS inet_ntoa_10;
SELECT INET_NTOA(4294967295) AS inet_ntoa_max;
SELECT INET_NTOA(0) AS inet_ntoa_zero;
SELECT INET_NTOA(2130706433) AS inet_ntoa_localhost;
SELECT INET_NTOA(NULL) AS inet_ntoa_null;
SELECT INET_NTOA(-1) AS inet_ntoa_negative;
SELECT INET_NTOA(4294967296) AS inet_ntoa_overflow;

-- Round trip tests
SELECT INET_NTOA(INET_ATON('192.168.1.1')) AS inet_roundtrip;
SELECT INET_ATON(INET_NTOA(3232235777)) AS inet_roundtrip2;
