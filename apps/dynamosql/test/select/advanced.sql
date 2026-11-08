-- Test SELECT with DATABASE() function
SELECT DATABASE();

-- Test SELECT with NOW()
SELECT NOW() AS ignore_seconds;

-- Test SELECT with CURDATE()
SELECT CURDATE() AS `current_date`;

-- Test SELECT with CURTIME()
SELECT CURTIME() AS ignore_seconds;

-- Test SELECT with DATE()
SELECT DATE(NOW()) AS today;

-- Test SELECT with SLEEP (0 seconds to not slow down tests)
SELECT SLEEP(0) AS sleep_result;
