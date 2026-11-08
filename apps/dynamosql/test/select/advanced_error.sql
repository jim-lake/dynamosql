SELECT DATABASE('foo');
SELECT id AS user_id, name AS user_name, email AS user_email FROM _dynamodb.users ORDER BY id LIMIT 3;
SELECT id, COALESCE(name, 'unknown') AS name FROM _dynamodb.users ORDER BY id LIMIT 3;
SELECT id, IFNULL(name, 'unknown') AS name FROM _dynamodb.users ORDER BY id LIMIT 3;
SELECT id, CONCAT(name, ' - ', email) AS info FROM _dynamodb.users ORDER BY id LIMIT 3;
SELECT id, name, LENGTH(name) AS name_length FROM _dynamodb.users ORDER BY id LIMIT 3;
SELECT id, LEFT(name, 3) AS name_prefix FROM _dynamodb.users ORDER BY id LIMIT 3;
SELECT id, LOWER(name) AS lowercase_name FROM _dynamodb.users ORDER BY id LIMIT 3;
