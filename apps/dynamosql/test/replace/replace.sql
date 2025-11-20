DELETE FROM _dynamodb.foo WHERE id = "111222333";
UPDATE _dynamodb.foo SET comment = "4 comment", other = 4 WHERE id = "4";
UPDATE _dynamodb.foo SET comment = "99 comment with null", other = null WHERE id = "99";
UPDATE _dynamodb.foo SET comment = "111 comment", other = 111 WHERE id = "111";
UPDATE _dynamodb.foo SET comment = "112 comment", other = 222 WHERE id = "112";
UPDATE _dynamodb.foo SET comment = "113 comment", other = 333 WHERE id = "113";
UPDATE _dynamodb.foo SET comment = "114 comment with null", other = null WHERE id = "114";
UPDATE _dynamodb.foo SET comment = "115 comment dup 222", other = 222 WHERE id = "115";
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;

REPLACE INTO _dynamodb.foo SET id = "111", other = 222, comment = "111 replace";
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
REPLACE INTO _dynamodb.foo SET id = "111222333", other = 1122333, comment = "111222333 replace";
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
REPLACE INTO _dynamodb.foo SET id = "4", comment = "4 replace";
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
REPLACE INTO _dynamodb.foo SET id = "4", comment = null;
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;

-- reset
DELETE FROM _dynamodb.foo WHERE id = "111222333";
UPDATE _dynamodb.foo SET comment = "4 comment", other = 4 WHERE id = "4";
UPDATE _dynamodb.foo SET comment = "99 comment with null", other = null WHERE id = "99";
UPDATE _dynamodb.foo SET comment = "111 comment", other = 111 WHERE id = "111";
UPDATE _dynamodb.foo SET comment = "112 comment", other = 222 WHERE id = "112";
UPDATE _dynamodb.foo SET comment = "113 comment", other = 333 WHERE id = "113";
UPDATE _dynamodb.foo SET comment = "114 comment with null", other = null WHERE id = "114";
UPDATE _dynamodb.foo SET comment = "115 comment dup 222", other = 222 WHERE id = "115";
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
