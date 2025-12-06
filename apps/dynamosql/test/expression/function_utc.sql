-- UTC_DATE() tests
SELECT UTC_DATE() AS ignore_seconds;
SELECT UTC_DATE() >= '2025-01-01' AS utc_date_reasonable;

-- UTC_TIME() tests
SELECT UTC_TIME() AS ignore_seconds;
SELECT UTC_TIME(0) AS ignore_seconds;
SELECT UTC_TIME(1) AS ignore_seconds;
SELECT UTC_TIME(2) AS ignore_seconds;
SELECT UTC_TIME(3) AS ignore_seconds;
SELECT UTC_TIME(4) AS ignore_seconds;
SELECT UTC_TIME(5) AS ignore_seconds;
SELECT UTC_TIME(6) AS ignore_seconds;

-- UTC_TIMESTAMP() tests
SELECT UTC_TIMESTAMP() AS ignore_seconds;
SELECT UTC_TIMESTAMP() >= '2025-01-01 00:00:00' AS utc_timestamp_reasonable;
SELECT UTC_TIMESTAMP(0) AS ignore_seconds;
SELECT UTC_TIMESTAMP(1) AS ignore_seconds;
SELECT UTC_TIMESTAMP(2) AS ignore_seconds;
SELECT UTC_TIMESTAMP(3) AS ignore_seconds;
SELECT UTC_TIMESTAMP(4) AS ignore_seconds;
SELECT UTC_TIMESTAMP(5) AS ignore_seconds;
SELECT UTC_TIMESTAMP(6) AS ignore_seconds;

-- Compare UTC vs local (should be close)
SELECT UTC_DATE() <= CURDATE() + INTERVAL 1 DAY AS utc_date_vs_local;
SELECT UTC_TIMESTAMP() <= NOW() + INTERVAL 24 HOUR AS utc_timestamp_vs_local;
