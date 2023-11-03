SELECT FROM_UNIXTIME(0) + INTERVAL 1 MICROSECOND AS foo;
SELECT FROM_UNIXTIME(0) + INTERVAL 1 SECOND AS foo;
SELECT FROM_UNIXTIME(0) + INTERVAL 1 MINUTE AS foo;
SELECT FROM_UNIXTIME(0) + INTERVAL 1 HOUR AS foo;
SELECT FROM_UNIXTIME(0) + INTERVAL 1 DAY AS foo;
SELECT FROM_UNIXTIME(0) + INTERVAL 1 MONTH AS foo;
SELECT FROM_UNIXTIME(0) + INTERVAL 1 QUARTER AS foo;
SELECT FROM_UNIXTIME(0) + INTERVAL 1 YEAR AS foo;
SELECT CAST("09:00" AS TIME) + INTERVAL 1 MICROSECOND AS foo;
SELECT CAST("09:00" AS TIME) + INTERVAL 1 SECOND AS foo;
SELECT CAST("09:00" AS TIME) + INTERVAL 1 MINUTE AS foo;
SELECT CAST("09:00" AS TIME) + INTERVAL 1 HOUR AS foo;
SELECT CAST("09:00" AS TIME) + INTERVAL 1 DAY AS foo;
SELECT CAST("09:00" AS TIME) + INTERVAL 1 MONTH AS foo;
SELECT CAST("09:00" AS TIME) + INTERVAL 1 QUARTER AS foo;
SELECT CAST("09:00" AS TIME) + INTERVAL 1 YEAR AS foo;
SELECT CAST("2023-1-1" AS DATE) + INTERVAL 1 MICROSECOND AS foo;
SELECT CAST("2023-1-1" AS DATE) + INTERVAL 1 SECOND AS foo;
SELECT CAST("2023-1-1" AS DATE) + INTERVAL 1 MINUTE AS foo;
SELECT CAST("2023-1-1" AS DATE) + INTERVAL 1 HOUR AS foo;
SELECT CAST("2023-1-1" AS DATE) + INTERVAL 1 DAY AS foo;
SELECT CAST("2023-1-1" AS DATE) + INTERVAL 1 MONTH AS foo;
SELECT CAST("2023-1-1" AS DATE) + INTERVAL 1 QUARTER AS foo;
SELECT CAST("2023-1-1" AS DATE) + INTERVAL 1 YEAR AS foo;
SELECT CAST("2023-1-1" AS DATETIME) + INTERVAL 1 MICROSECOND AS foo;
SELECT CAST("2023-1-1" AS DATETIME) + INTERVAL 1 SECOND AS foo;
SELECT CAST("2023-1-1" AS DATETIME) + INTERVAL 1 MINUTE AS foo;
SELECT CAST("2023-1-1" AS DATETIME) + INTERVAL 1 HOUR AS foo;
SELECT CAST("2023-1-1" AS DATETIME) + INTERVAL 1 DAY AS foo;
SELECT CAST("2023-1-1" AS DATETIME) + INTERVAL 1 MONTH AS foo;
SELECT CAST("2023-1-1" AS DATETIME) + INTERVAL 1 QUARTER AS foo;
SELECT CAST("2023-1-1" AS DATETIME) + INTERVAL 1 YEAR AS foo;
SELECT CAST("2023-01-01 07:03:33" AS DATETIME) + INTERVAL 1 MICROSECOND AS foo;
SELECT CAST("2023-01-01 07:03:33" AS DATETIME) + INTERVAL 1 SECOND AS foo;
SELECT CAST("2023-01-01 07:03:33" AS DATETIME) + INTERVAL 1 MINUTE AS foo;
SELECT CAST("2023-01-01 07:03:33" AS DATETIME) + INTERVAL 1 HOUR AS foo;
SELECT CAST("2023-01-01 07:03:33" AS DATETIME) + INTERVAL 1 DAY AS foo;
SELECT CAST("2023-01-01 07:03:33" AS DATETIME) + INTERVAL 1 MONTH AS foo;
SELECT CAST("2023-01-01 07:03:33" AS DATETIME) + INTERVAL 1 QUARTER AS foo;
SELECT CAST("2023-01-01 07:03:33" AS DATETIME) + INTERVAL 1 YEAR AS foo;
SELECT FROM_UNIXTIME(0) + INTERVAL 1.1 SECOND AS foo;
SELECT FROM_UNIXTIME(0) + INTERVAL 1.12 SECOND AS foo;
SELECT FROM_UNIXTIME(0) + INTERVAL 1.123 SECOND AS foo;
SELECT FROM_UNIXTIME(0) + INTERVAL 1.1234 SECOND AS foo;
SELECT FROM_UNIXTIME(0) + INTERVAL 1.12345 SECOND AS foo;
SELECT FROM_UNIXTIME(0) + INTERVAL 1.123456 SECOND AS foo;
SELECT FROM_UNIXTIME(0) + INTERVAL 1.1234567 SECOND AS foo;
SELECT FROM_UNIXTIME(0) + INTERVAL "1.1" SECOND AS foo;
SELECT FROM_UNIXTIME(0) + INTERVAL "1.12" SECOND AS foo;
SELECT FROM_UNIXTIME(0) + INTERVAL "1.123" SECOND AS foo;
SELECT FROM_UNIXTIME(0) + INTERVAL "1.1234" SECOND AS foo;
SELECT FROM_UNIXTIME(0) + INTERVAL "1.12345" SECOND AS foo;
SELECT FROM_UNIXTIME(0) + INTERVAL "1.123456" SECOND AS foo;
SELECT FROM_UNIXTIME(0) + INTERVAL "1.1234567" SECOND AS foo;
SELECT CAST("09:00" AS TIME) + INTERVAL "1.1" SECOND AS foo;
SELECT CAST("09:00" AS TIME) + INTERVAL "1.12" SECOND AS foo;
SELECT CAST("09:00" AS TIME) + INTERVAL "1.123" SECOND AS foo;
SELECT CAST("09:00" AS TIME) + INTERVAL "1.1234" SECOND AS foo;
SELECT CAST("09:00" AS TIME) + INTERVAL "1.12345" SECOND AS foo;
SELECT CAST("09:00" AS TIME) + INTERVAL "1.123456" SECOND AS foo;
SELECT CAST("09:00" AS TIME) + INTERVAL "1.1234567" SECOND AS foo;
SELECT CAST("2023-1-1" AS DATE) + INTERVAL "1.1" SECOND AS foo;
SELECT CAST("2023-1-1" AS DATE) + INTERVAL "1.12" SECOND AS foo;
SELECT CAST("2023-1-1" AS DATE) + INTERVAL "1.123" SECOND AS foo;
SELECT CAST("2023-1-1" AS DATE) + INTERVAL "1.1234" SECOND AS foo;
SELECT CAST("2023-1-1" AS DATE) + INTERVAL "1.12345" SECOND AS foo;
SELECT CAST("2023-1-1" AS DATE) + INTERVAL "1.123456" SECOND AS foo;
SELECT CAST("2023-1-1" AS DATE) + INTERVAL "1.1234567" SECOND AS foo;
SELECT CAST("2023-01-01 07:03:33" AS DATETIME) + INTERVAL "1.1" SECOND AS foo;
SELECT CAST("2023-01-01 07:03:33" AS DATETIME) + INTERVAL "1.12" SECOND AS foo;
SELECT CAST("2023-01-01 07:03:33" AS DATETIME) + INTERVAL "1.123" SECOND AS foo;
SELECT CAST("2023-01-01 07:03:33" AS DATETIME) + INTERVAL "1.1234" SECOND AS foo;
SELECT CAST("2023-01-01 07:03:33" AS DATETIME) + INTERVAL "1.12345" SECOND AS foo;
SELECT CAST("2023-01-01 07:03:33" AS DATETIME) + INTERVAL "1.123456" SECOND AS foo;
SELECT CAST("2023-01-01 07:03:33" AS DATETIME) + INTERVAL "1.1234567" SECOND AS foo;
SELECT FROM_UNIXTIME(0) + INTERVAL "1.1" MINUTE AS foo;
SELECT CAST("09:00" AS TIME) + INTERVAL "1.1" MINUTE AS foo;
SELECT CAST("2023-1-1" AS DATE) + INTERVAL "1.1" MINUTE AS foo;
SELECT CAST("2023-01-01 07:03:33" AS DATETIME) + INTERVAL "1.1" MINUTE AS foo;
SELECT FROM_UNIXTIME(0) + INTERVAL "1.1" HOUR AS foo;
SELECT CAST("09:00" AS TIME) + INTERVAL "1.1" HOUR AS foo;
SELECT CAST("2023-1-1" AS DATE) + INTERVAL "1.1" HOUR AS foo;
SELECT CAST("2023-01-01 07:03:33" AS DATETIME) + INTERVAL "1.1" HOUR AS foo;
SELECT FROM_UNIXTIME(0) + INTERVAL "1.1" DAY AS foo;
SELECT CAST("09:00" AS TIME) + INTERVAL "1.1" DAY AS foo;
SELECT CAST("2023-1-1" AS DATE) + INTERVAL "1.1" DAY AS foo;
SELECT CAST("2023-01-01 07:03:33" AS DATETIME) + INTERVAL "1.1" DAY AS foo;
SELECT FROM_UNIXTIME(0) + INTERVAL "1.1" MONTH AS foo;
SELECT CAST("09:00" AS TIME) + INTERVAL "1.1" MONTH AS foo;
SELECT CAST("2023-1-1" AS DATE) + INTERVAL "1.1" MONTH AS foo;
SELECT CAST("2023-01-01 07:03:33" AS DATETIME) + INTERVAL "1.1" MONTH AS foo;
SELECT FROM_UNIXTIME(0) + INTERVAL 1.1 MINUTE AS foo;
SELECT CAST("09:00" AS TIME) + INTERVAL 1.1 MINUTE AS foo;
SELECT CAST("2023-1-1" AS DATE) + INTERVAL 1.1 MINUTE AS foo;
SELECT CAST("2023-01-01 07:03:33" AS DATETIME) + INTERVAL 1.1 MINUTE AS foo;
SELECT FROM_UNIXTIME(0) + INTERVAL 1.1 HOUR AS foo;
SELECT CAST("09:00" AS TIME) + INTERVAL 1.1 HOUR AS foo;
SELECT CAST("2023-1-1" AS DATE) + INTERVAL 1.1 HOUR AS foo;
SELECT CAST("2023-01-01 07:03:33" AS DATETIME) + INTERVAL 1.1 HOUR AS foo;
SELECT FROM_UNIXTIME(0) + INTERVAL 1.1 DAY AS foo;
SELECT CAST("09:00" AS TIME) + INTERVAL 1.1 DAY AS foo;
SELECT CAST("2023-1-1" AS DATE) + INTERVAL 1.1 DAY AS foo;
SELECT CAST("2023-01-01 07:03:33" AS DATETIME) + INTERVAL 1.1 DAY AS foo;
SELECT FROM_UNIXTIME(0) + INTERVAL 1.1 MONTH AS foo;
SELECT CAST("09:00" AS TIME) + INTERVAL 1.1 MONTH AS foo;
SELECT CAST("2023-1-1" AS DATE) + INTERVAL 1.1 MONTH AS foo;
SELECT CAST("2023-01-01 07:03:33" AS DATETIME) + INTERVAL 1.1 MONTH AS foo;

SELECT CAST("2004-01-01 09:00" AS DATETIME) + INTERVAL 1 MONTH AS foo;
SELECT CAST("2023-01-01 09:00" AS DATETIME) + INTERVAL 1 MONTH AS foo;
SELECT CAST("2023-10-31 09:00" AS DATETIME) + INTERVAL 1 MONTH AS foo;
SELECT CAST("2023-10-31 09:00" AS DATETIME) + INTERVAL 1 QUARTER AS foo;
SELECT CAST("2023-10-31 09:00" AS DATETIME) + INTERVAL 1 YEAR AS foo;

SELECT FROM_UNIXTIME(0) - INTERVAL 1 MICROSECOND AS foo;
SELECT FROM_UNIXTIME(0) - INTERVAL 1 SECOND AS foo;
SELECT FROM_UNIXTIME(0) - INTERVAL 1 MINUTE AS foo;
SELECT FROM_UNIXTIME(0) - INTERVAL 1 HOUR AS foo;
SELECT FROM_UNIXTIME(0) - INTERVAL 1 DAY AS foo;
SELECT FROM_UNIXTIME(0) - INTERVAL 1 MONTH AS foo;
SELECT FROM_UNIXTIME(0) - INTERVAL 1 QUARTER AS foo;
SELECT FROM_UNIXTIME(0) - INTERVAL 1 YEAR AS foo;
SELECT CAST("09:00" AS TIME) - INTERVAL 1 MICROSECOND AS foo;
SELECT CAST("09:00" AS TIME) - INTERVAL 1 SECOND AS foo;
SELECT CAST("09:00" AS TIME) - INTERVAL 1 MINUTE AS foo;
SELECT CAST("09:00" AS TIME) - INTERVAL 1 HOUR AS foo;
SELECT CAST("09:00" AS TIME) - INTERVAL 1 DAY AS foo;
SELECT CAST("09:00" AS TIME) - INTERVAL 1 MONTH AS foo;
SELECT CAST("09:00" AS TIME) - INTERVAL 1 QUARTER AS foo;
SELECT CAST("09:00" AS TIME) - INTERVAL 1 YEAR AS foo;
SELECT CAST("2023-1-1" AS DATE) - INTERVAL 1 MICROSECOND AS foo;
SELECT CAST("2023-1-1" AS DATE) - INTERVAL 1 SECOND AS foo;
SELECT CAST("2023-1-1" AS DATE) - INTERVAL 1 MINUTE AS foo;
SELECT CAST("2023-1-1" AS DATE) - INTERVAL 1 HOUR AS foo;
SELECT CAST("2023-1-1" AS DATE) - INTERVAL 1 DAY AS foo;
SELECT CAST("2023-1-1" AS DATE) - INTERVAL 1 MONTH AS foo;
SELECT CAST("2023-1-1" AS DATE) - INTERVAL 1 QUARTER AS foo;
SELECT CAST("2023-1-1" AS DATE) - INTERVAL 1 YEAR AS foo;
SELECT CAST("2023-1-1" AS DATETIME) - INTERVAL 1 MICROSECOND AS foo;
SELECT CAST("2023-1-1" AS DATETIME) - INTERVAL 1 SECOND AS foo;
SELECT CAST("2023-1-1" AS DATETIME) - INTERVAL 1 MINUTE AS foo;
SELECT CAST("2023-1-1" AS DATETIME) - INTERVAL 1 HOUR AS foo;
SELECT CAST("2023-1-1" AS DATETIME) - INTERVAL 1 DAY AS foo;
SELECT CAST("2023-1-1" AS DATETIME) - INTERVAL 1 MONTH AS foo;
SELECT CAST("2023-1-1" AS DATETIME) - INTERVAL 1 QUARTER AS foo;
SELECT CAST("2023-1-1" AS DATETIME) - INTERVAL 1 YEAR AS foo;
SELECT CAST("2023-01-01 07:03:33" AS DATETIME) - INTERVAL 1 MICROSECOND AS foo;
SELECT CAST("2023-01-01 07:03:33" AS DATETIME) - INTERVAL 1 SECOND AS foo;
SELECT CAST("2023-01-01 07:03:33" AS DATETIME) - INTERVAL 1 MINUTE AS foo;
SELECT CAST("2023-01-01 07:03:33" AS DATETIME) - INTERVAL 1 HOUR AS foo;
SELECT CAST("2023-01-01 07:03:33" AS DATETIME) - INTERVAL 1 DAY AS foo;
SELECT CAST("2023-01-01 07:03:33" AS DATETIME) - INTERVAL 1 MONTH AS foo;
SELECT CAST("2023-01-01 07:03:33" AS DATETIME) - INTERVAL 1 QUARTER AS foo;
SELECT CAST("2023-01-01 07:03:33" AS DATETIME) - INTERVAL 1 YEAR AS foo;
SELECT FROM_UNIXTIME(0) - INTERVAL 1 SECOND AS foo;
SELECT FROM_UNIXTIME(0) - INTERVAL 1.1 SECOND AS foo;
SELECT FROM_UNIXTIME(0) - INTERVAL 1.12 SECOND AS foo;
SELECT FROM_UNIXTIME(0) - INTERVAL 1.123 SECOND AS foo;
SELECT FROM_UNIXTIME(0) - INTERVAL 1.1234 SECOND AS foo;
SELECT FROM_UNIXTIME(0) - INTERVAL 1.12345 SECOND AS foo;
SELECT FROM_UNIXTIME(0) - INTERVAL 1.123456 SECOND AS foo;
SELECT FROM_UNIXTIME(0) - INTERVAL 1.1234567 SECOND AS foo;
SELECT FROM_UNIXTIME(0) - INTERVAL "1.1" SECOND AS foo;
SELECT FROM_UNIXTIME(0) - INTERVAL "1.12" SECOND AS foo;
SELECT FROM_UNIXTIME(0) - INTERVAL "1.123" SECOND AS foo;
SELECT FROM_UNIXTIME(0) - INTERVAL "1.1234" SECOND AS foo;
SELECT FROM_UNIXTIME(0) - INTERVAL "1.12345" SECOND AS foo;
SELECT FROM_UNIXTIME(0) - INTERVAL "1.123456" SECOND AS foo;
SELECT FROM_UNIXTIME(0) - INTERVAL "1.1234567" SECOND AS foo;
SELECT CAST("09:00" AS TIME) - INTERVAL "1.1" SECOND AS foo;
SELECT CAST("09:00" AS TIME) - INTERVAL "1.12" SECOND AS foo;
SELECT CAST("09:00" AS TIME) - INTERVAL "1.123" SECOND AS foo;
SELECT CAST("09:00" AS TIME) - INTERVAL "1.1234" SECOND AS foo;
SELECT CAST("09:00" AS TIME) - INTERVAL "1.12345" SECOND AS foo;
SELECT CAST("09:00" AS TIME) - INTERVAL "1.123456" SECOND AS foo;
SELECT CAST("09:00" AS TIME) - INTERVAL "1.1234567" SECOND AS foo;
SELECT CAST("2023-1-1" AS DATE) - INTERVAL "1.1" SECOND AS foo;
SELECT CAST("2023-1-1" AS DATE) - INTERVAL "1.12" SECOND AS foo;
SELECT CAST("2023-1-1" AS DATE) - INTERVAL "1.123" SECOND AS foo;
SELECT CAST("2023-1-1" AS DATE) - INTERVAL "1.1234" SECOND AS foo;
SELECT CAST("2023-1-1" AS DATE) - INTERVAL "1.12345" SECOND AS foo;
SELECT CAST("2023-1-1" AS DATE) - INTERVAL "1.123456" SECOND AS foo;
SELECT CAST("2023-1-1" AS DATE) - INTERVAL "1.1234567" SECOND AS foo;
SELECT CAST("2023-01-01 07:03:33" AS DATETIME) - INTERVAL "1.1" SECOND AS foo;
SELECT CAST("2023-01-01 07:03:33" AS DATETIME) - INTERVAL "1.12" SECOND AS foo;
SELECT CAST("2023-01-01 07:03:33" AS DATETIME) - INTERVAL "1.123" SECOND AS foo;
SELECT CAST("2023-01-01 07:03:33" AS DATETIME) - INTERVAL "1.1234" SECOND AS foo;
SELECT CAST("2023-01-01 07:03:33" AS DATETIME) - INTERVAL "1.12345" SECOND AS foo;
SELECT CAST("2023-01-01 07:03:33" AS DATETIME) - INTERVAL "1.123456" SECOND AS foo;
SELECT CAST("2023-01-01 07:03:33" AS DATETIME) - INTERVAL "1.1234567" SECOND AS foo;
SELECT FROM_UNIXTIME(0) - INTERVAL "1.1" MINUTE AS foo;
SELECT CAST("09:00" AS TIME) - INTERVAL "1.1" MINUTE AS foo;
SELECT CAST("2023-1-1" AS DATE) - INTERVAL "1.1" MINUTE AS foo;
SELECT CAST("2023-01-01 07:03:33" AS DATETIME) - INTERVAL "1.1" MINUTE AS foo;
SELECT FROM_UNIXTIME(0) - INTERVAL "1.1" HOUR AS foo;
SELECT CAST("09:00" AS TIME) - INTERVAL "1.1" HOUR AS foo;
SELECT CAST("2023-1-1" AS DATE) - INTERVAL "1.1" HOUR AS foo;
SELECT CAST("2023-01-01 07:03:33" AS DATETIME) - INTERVAL "1.1" HOUR AS foo;
SELECT FROM_UNIXTIME(0) - INTERVAL "1.1" DAY AS foo;
SELECT CAST("09:00" AS TIME) - INTERVAL "1.1" DAY AS foo;
SELECT CAST("2023-1-1" AS DATE) - INTERVAL "1.1" DAY AS foo;
SELECT CAST("2023-01-01 07:03:33" AS DATETIME) - INTERVAL "1.1" DAY AS foo;
SELECT FROM_UNIXTIME(0) - INTERVAL "1.1" MONTH AS foo;
SELECT CAST("09:00" AS TIME) - INTERVAL "1.1" MONTH AS foo;
SELECT CAST("2023-1-1" AS DATE) - INTERVAL "1.1" MONTH AS foo;
SELECT CAST("2023-01-01 07:03:33" AS DATETIME) - INTERVAL "1.1" MONTH AS foo;
SELECT FROM_UNIXTIME(0) - INTERVAL 1.1 MINUTE AS foo;
SELECT CAST("09:00" AS TIME) - INTERVAL 1.1 MINUTE AS foo;
SELECT CAST("2023-1-1" AS DATE) - INTERVAL 1.1 MINUTE AS foo;
SELECT CAST("2023-01-01 07:03:33" AS DATETIME) - INTERVAL 1.1 MINUTE AS foo;
SELECT FROM_UNIXTIME(0) - INTERVAL 1.1 HOUR AS foo;
SELECT CAST("09:00" AS TIME) - INTERVAL 1.1 HOUR AS foo;
SELECT CAST("2023-1-1" AS DATE) - INTERVAL 1.1 HOUR AS foo;
SELECT CAST("2023-01-01 07:03:33" AS DATETIME) - INTERVAL 1.1 HOUR AS foo;
SELECT FROM_UNIXTIME(0) - INTERVAL 1.1 DAY AS foo;
SELECT CAST("09:00" AS TIME) - INTERVAL 1.1 DAY AS foo;
SELECT CAST("2023-1-1" AS DATE) - INTERVAL 1.1 DAY AS foo;
SELECT CAST("2023-01-01 07:03:33" AS DATETIME) - INTERVAL 1.1 DAY AS foo;
SELECT FROM_UNIXTIME(0) - INTERVAL 1.1 MONTH AS foo;
SELECT CAST("09:00" AS TIME) - INTERVAL 1.1 MONTH AS foo;
SELECT CAST("2023-1-1" AS DATE) - INTERVAL 1.1 MONTH AS foo;
SELECT CAST("2023-01-01 07:03:33" AS DATETIME) - INTERVAL 1.1 MONTH AS foo;

SELECT CAST("00:00:00" AS TIME) - INTERVAL 1 MICROSECOND AS foo;
SELECT CAST("00:00:00" AS TIME) + INTERVAL 1 MICROSECOND AS foo;
SELECT CAST("00:00:00" AS TIME) - INTERVAL 1 SECOND AS foo;
SELECT CAST("00:00:00" AS TIME) + INTERVAL 1 SECOND AS foo;
SELECT CAST("23:59:59" AS TIME) - INTERVAL 1 MICROSECOND AS foo;
SELECT CAST("23:59:59" AS TIME) + INTERVAL 1 MICROSECOND AS foo;

SELECT CAST("1000-01-01" AS DATE) - INTERVAL 1 YEAR AS foo;
SELECT CAST("9999-12-31" AS DATE) + INTERVAL 1 YEAR AS foo;
-- mysql bug SELECT CAST("0001-01-01" AS DATE) - INTERVAL 1 DAY AS foo;
SELECT CAST("9999-12-31" AS DATE) + INTERVAL 1 DAY AS foo;

SELECT CAST("1000-01-01 00:00:00" AS DATETIME) - INTERVAL 1 YEAR AS foo;
SELECT CAST("9999-12-31 23:59:59" AS DATETIME) + INTERVAL 1 YEAR AS foo;
-- mysql bug SELECT CAST("0001-01-01 00:00:00" AS DATETIME) - INTERVAL 1 DAY AS foo;
SELECT CAST("9999-12-31 23:59:59" AS DATETIME) + INTERVAL 1 DAY AS foo;
-- mysql bug SELECT CAST("0001-01-01 00:00:00" AS DATETIME) - INTERVAL 1 SECOND AS foo;
SELECT CAST("9999-12-31 23:59:59" AS DATETIME) + INTERVAL 1 SECOND AS foo;

SELECT CAST("2024-02-28" AS DATE) + INTERVAL 1 DAY AS foo;
SELECT CAST("2023-02-28" AS DATE) + INTERVAL 1 DAY AS foo;

SELECT CAST("2023-03-12 01:59:59" AS DATETIME) + INTERVAL 1 SECOND AS foo;
SELECT CAST("2023-11-05 01:59:59" AS DATETIME) + INTERVAL 1 SECOND AS foo;

SELECT CAST("23:59:59" AS TIME) + INTERVAL 1 SECOND AS foo;
SELECT CAST("9999-12-31" AS DATE) + INTERVAL 1 SECOND AS foo;
SELECT CAST("9999-12-31 23:59:59" AS DATETIME) + INTERVAL 1 SECOND AS foo;

SELECT CAST("00:00:00" AS TIME) - INTERVAL 1 SECOND AS foo;
-- mysql bug SELECT CAST("0001-01-01" AS DATE) - INTERVAL 1 SECOND AS foo;
-- mysql bug SELECT CAST("0001-01-01 00:00:00" AS DATETIME) - INTERVAL 1 SECOND AS foo;

SELECT CAST("2020-01-01 23:59:59.000009" AS DATETIME(6)) + INTERVAL 1 MICROSECOND AS foo;
SELECT CAST("2020-01-01 23:59:59.000009" AS DATETIME(6)) + INTERVAL 999995 MICROSECOND AS foo;
SELECT CAST("2020-01-01 23:59:59.9" AS DATETIME(6)) + INTERVAL 999995 MICROSECOND AS foo;
SELECT CAST("2020-01-01 23:59:59.999000" AS DATETIME(6)) + INTERVAL 999995 MICROSECOND AS foo;
SELECT CAST("2020-01-01 23:59:59.999999" AS DATETIME(6)) + INTERVAL 999995 MICROSECOND AS foo;

SELECT CAST("1020-01-01 23:59:59.000009" AS DATETIME(6)) + INTERVAL 1 MICROSECOND AS foo;
SELECT CAST("1020-01-01 23:59:59.000009" AS DATETIME(6)) + INTERVAL 999995 MICROSECOND AS foo;
SELECT CAST("1020-01-01 23:59:59.9" AS DATETIME(6)) + INTERVAL 999995 MICROSECOND AS foo;
SELECT CAST("1020-01-01 23:59:59.999000" AS DATETIME(6)) + INTERVAL 999995 MICROSECOND AS foo;
SELECT CAST("1020-01-01 23:59:59.999999" AS DATETIME(6)) + INTERVAL 999995 MICROSECOND AS foo;

SELECT CAST("1020-01-01 23:59:59.000009" AS DATETIME(6)) + INTERVAL 1 MICROSECOND AS foo;
SELECT CAST("1020-01-01 23:59:59.000009" AS DATETIME(6)) + INTERVAL 999995 MICROSECOND AS foo;
SELECT CAST("1020-01-01 23:59:59.000001" AS DATETIME(6)) + INTERVAL 999995 MICROSECOND AS foo;
SELECT CAST("1020-01-01 23:59:59.00009" AS DATETIME(6)) + INTERVAL 999995 MICROSECOND AS foo;
SELECT CAST("1020-01-01 23:59:59.0009" AS DATETIME(6)) + INTERVAL 999995 MICROSECOND AS foo;

SELECT CAST("2020-01-01 23:59:59.000009" AS DATETIME(6)) - INTERVAL 1 MICROSECOND AS foo;
SELECT CAST("2020-01-01 23:59:59.000009" AS DATETIME(6)) - INTERVAL 999995 MICROSECOND AS foo;
SELECT CAST("2020-01-01 23:59:59.9" AS DATETIME(6)) - INTERVAL 999995 MICROSECOND AS foo;
SELECT CAST("2020-01-01 23:59:59.999000" AS DATETIME(6)) - INTERVAL 999995 MICROSECOND AS foo;
SELECT CAST("2020-01-01 23:59:59.999999" AS DATETIME(6)) - INTERVAL 999995 MICROSECOND AS foo;

SELECT CAST("1020-01-01 23:59:59.000009" AS DATETIME(6)) - INTERVAL 1 MICROSECOND AS foo;
SELECT CAST("1020-01-01 23:59:59.000009" AS DATETIME(6)) - INTERVAL 999995 MICROSECOND AS foo;
SELECT CAST("1020-01-01 23:59:59.9" AS DATETIME(6)) - INTERVAL 999995 MICROSECOND AS foo;
SELECT CAST("1020-01-01 23:59:59.999000" AS DATETIME(6)) - INTERVAL 999995 MICROSECOND AS foo;
SELECT CAST("1020-01-01 23:59:59.999999" AS DATETIME(6)) - INTERVAL 999995 MICROSECOND AS foo;

SELECT CAST("1020-01-01 23:59:59.000009" AS DATETIME(6)) - INTERVAL 1 MICROSECOND AS foo;
SELECT CAST("1020-01-01 23:59:59.000009" AS DATETIME(6)) - INTERVAL 999995 MICROSECOND AS foo;
SELECT CAST("1020-01-01 23:59:59.000001" AS DATETIME(6)) - INTERVAL 999995 MICROSECOND AS foo;
SELECT CAST("1020-01-01 23:59:59.00009" AS DATETIME(6)) - INTERVAL 999995 MICROSECOND AS foo;
SELECT CAST("1020-01-01 23:59:59.0009" AS DATETIME(6)) - INTERVAL 999995 MICROSECOND AS foo;

SELECT CAST("2020-01-01 23:59:59.000009" AS DATETIME(6)) + INTERVAL 1 MICROSECOND AS foo;
SELECT CAST("2020-01-01 23:59:59.000009" AS DATETIME(6)) + INTERVAL 999995 MICROSECOND AS foo;
SELECT CAST("2020-01-01 23:59:59.9" AS DATETIME(6)) + INTERVAL 999995 MICROSECOND AS foo;
SELECT CAST("2020-01-01 23:59:59.999000" AS DATETIME(6)) + INTERVAL 999995 MICROSECOND AS foo;
SELECT CAST("2020-01-01 23:59:59.999999" AS DATETIME(6)) + INTERVAL 999995 MICROSECOND AS foo;

SELECT CAST("1020-01-01 23:59:59.000009" AS DATETIME(6)) + INTERVAL -1 MICROSECOND AS foo;
SELECT CAST("1020-01-01 23:59:59.000009" AS DATETIME(6)) + INTERVAL -999995 MICROSECOND AS foo;
SELECT CAST("1020-01-01 23:59:59.9" AS DATETIME(6)) + INTERVAL -999995 MICROSECOND AS foo;
SELECT CAST("1020-01-01 23:59:59.999000" AS DATETIME(6)) + INTERVAL -999995 MICROSECOND AS foo;
SELECT CAST("1020-01-01 23:59:59.999999" AS DATETIME(6)) + INTERVAL -999995 MICROSECOND AS foo;

SELECT CAST("1020-01-01 23:59:59.000009" AS DATETIME(6)) + INTERVAL -1 MICROSECOND AS foo;
SELECT CAST("1020-01-01 23:59:59.000009" AS DATETIME(6)) + INTERVAL -999995 MICROSECOND AS foo;
SELECT CAST("1020-01-01 23:59:59.000001" AS DATETIME(6)) + INTERVAL -999995 MICROSECOND AS foo;
SELECT CAST("1020-01-01 23:59:59.00009" AS DATETIME(6)) + INTERVAL -999995 MICROSECOND AS foo;
SELECT CAST("1020-01-01 23:59:59.0009" AS DATETIME(6)) + INTERVAL -999995 MICROSECOND AS foo;

SELECT CAST("2020-01-01 23:59:59.000009" AS DATETIME(6)) - INTERVAL -1 MICROSECOND AS foo;
SELECT CAST("2020-01-01 23:59:59.000009" AS DATETIME(6)) - INTERVAL -999995 MICROSECOND AS foo;
SELECT CAST("2020-01-01 23:59:59.9" AS DATETIME(6)) - INTERVAL -999995 MICROSECOND AS foo;
SELECT CAST("2020-01-01 23:59:59.999000" AS DATETIME(6)) - INTERVAL -999995 MICROSECOND AS foo;
SELECT CAST("2020-01-01 23:59:59.999999" AS DATETIME(6)) - INTERVAL -999995 MICROSECOND AS foo;

SELECT CAST("1020-01-01 23:59:59.000009" AS DATETIME(6)) - INTERVAL -1 MICROSECOND AS foo;
SELECT CAST("1020-01-01 23:59:59.000009" AS DATETIME(6)) - INTERVAL -999995 MICROSECOND AS foo;
SELECT CAST("1020-01-01 23:59:59.9" AS DATETIME(6)) - INTERVAL -999995 MICROSECOND AS foo;
SELECT CAST("1020-01-01 23:59:59.999000" AS DATETIME(6)) - INTERVAL -999995 MICROSECOND AS foo;
SELECT CAST("1020-01-01 23:59:59.999999" AS DATETIME(6)) - INTERVAL -999995 MICROSECOND AS foo;

SELECT CAST("1020-01-01 23:59:59.000009" AS DATETIME(6)) - INTERVAL -1 MICROSECOND AS foo;
SELECT CAST("1020-01-01 23:59:59.000009" AS DATETIME(6)) - INTERVAL -999995 MICROSECOND AS foo;
SELECT CAST("1020-01-01 23:59:59.000001" AS DATETIME(6)) - INTERVAL -999995 MICROSECOND AS foo;
SELECT CAST("1020-01-01 23:59:59.00009" AS DATETIME(6)) - INTERVAL -999995 MICROSECOND AS foo;
SELECT CAST("1020-01-01 23:59:59.0009" AS DATETIME(6)) - INTERVAL -999995 MICROSECOND AS foo;

SELECT "22:00:00" + INTERVAL 1 SECOND AS foo;
SELECT "22:01:02" + INTERVAL 1 SECOND AS foo;
SELECT "22:01:02.123" + INTERVAL 1 SECOND AS foo;
SELECT "3 22:01:02.123" + INTERVAL 1 SECOND AS foo;
SELECT "2010-01-01" + INTERVAL 1 SECOND AS foo;
SELECT "2010-01-01 22:01" + INTERVAL 1 SECOND AS foo;
SELECT "2010-01-01 22:01:02" + INTERVAL 1 SECOND AS foo;
SELECT "2010-01-01 22:01:02.123" + INTERVAL 1 SECOND AS foo;

SELECT "22:00:00" + INTERVAL 1 MONTH AS foo;
SELECT "22:01:02" + INTERVAL 1 MONTH AS foo;
SELECT "22:01:02.123" + INTERVAL 1 MONTH AS foo;
SELECT "3 22:01:02.123" + INTERVAL 1 MONTH AS foo;
SELECT "2010-01-01" + INTERVAL 1 MONTH AS foo;
SELECT "2010-01-01 22:01" + INTERVAL 1 MONTH AS foo;
SELECT "2010-01-01 22:01:02" + INTERVAL 1 MONTH AS foo;
SELECT "2010-01-01 22:01:02.123" + INTERVAL 1 MONTH AS foo;
