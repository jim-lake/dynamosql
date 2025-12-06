-- Test SELECT with DATABASE() function
SELECT DATABASE();
SELECT DATABASE('foo');

-- Test SELECT with multiple columns and aliases
SELECT id AS user_id, name AS user_name, email AS user_email FROM _dynamodb.users ORDER BY id LIMIT 3;

-- Test SELECT with COALESCE
SELECT id, COALESCE(name, 'unknown') AS name FROM _dynamodb.users ORDER BY id LIMIT 3;

-- Test SELECT with IFNULL
SELECT id, IFNULL(name, 'unknown') AS name FROM _dynamodb.users ORDER BY id LIMIT 3;

-- Test SELECT with CONCAT
SELECT id, CONCAT(name, ' - ', email) AS info FROM _dynamodb.users ORDER BY id LIMIT 3;

-- Test SELECT with LENGTH
SELECT id, name, LENGTH(name) AS name_length FROM _dynamodb.users ORDER BY id LIMIT 3;

-- Test SELECT with LEFT
SELECT id, LEFT(name, 3) AS name_prefix FROM _dynamodb.users ORDER BY id LIMIT 3;

-- Test SELECT with LOWER
SELECT id, LOWER(name) AS lowercase_name FROM _dynamodb.users ORDER BY id LIMIT 3;

-- Test SELECT with NOW()
SELECT NOW() AS current_timestamp;

-- Test SELECT with CURDATE()
SELECT CURDATE() AS current_date;

-- Test SELECT with CURTIME()
SELECT CURTIME() AS current_time;

-- Test SELECT with DATE()
SELECT DATE(NOW()) AS today;

-- Test SELECT with SLEEP (0 seconds to not slow down tests)
SELECT SLEEP(0) AS sleep_result;
