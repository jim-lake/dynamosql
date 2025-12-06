-- SEC_TO_TIME tests
SELECT SEC_TO_TIME(3661) AS sec_to_time_1;
SELECT SEC_TO_TIME(0) AS sec_to_time_zero;
SELECT SEC_TO_TIME(86400) AS sec_to_time_day;
SELECT SEC_TO_TIME(-3661) AS sec_to_time_neg;
SELECT SEC_TO_TIME(NULL) AS sec_to_time_null;

-- TIME_TO_SEC tests
SELECT TIME_TO_SEC('01:01:01') AS time_to_sec_1;
SELECT TIME_TO_SEC('00:00:00') AS time_to_sec_zero;
SELECT TIME_TO_SEC('24:00:00') AS time_to_sec_day;
SELECT TIME_TO_SEC('-01:01:01') AS time_to_sec_neg;
SELECT TIME_TO_SEC(NULL) AS time_to_sec_null;

-- Round trip tests
SELECT TIME_TO_SEC(SEC_TO_TIME(3661)) AS round_trip_1;
SELECT SEC_TO_TIME(TIME_TO_SEC('12:30:45')) AS round_trip_2;
