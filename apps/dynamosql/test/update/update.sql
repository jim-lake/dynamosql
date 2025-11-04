UPDATE _dynamodb.foo SET comment = "4 comment", other = 4 WHERE id = "4";
UPDATE _dynamodb.foo SET comment = "99 comment with null", other = null WHERE id = "99";
UPDATE _dynamodb.foo SET comment = "111 comment", other = 111 WHERE id = "111";
UPDATE _dynamodb.foo SET comment = "112 comment", other = 222 WHERE id = "112";
UPDATE _dynamodb.foo SET comment = "113 comment", other = 333 WHERE id = "113";
UPDATE _dynamodb.foo SET comment = "114 comment with null", other = null WHERE id = "114";
UPDATE _dynamodb.foo SET comment = "115 comment dup 222", other = 222 WHERE id = "115";
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;

UPDATE _dynamodb.foo SET other = 99 WHERE comment = "99 comment with null";
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
UPDATE _dynamodb.foo SET other = null WHERE comment = "99 comment with null";
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;

UPDATE _dynamodb.foo SET comment = "111 comment2" WHERE id = "111";
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
UPDATE _dynamodb.foo SET comment = "111 comment3" WHERE id = "123123";
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
UPDATE _dynamodb.foo SET comment = CONCAT(comment," concat") WHERE id = "111";
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
UPDATE _dynamodb.foo SET comment = CONCAT(comment," concat") WHERE id = "123123";
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
UPDATE _dynamodb.foo SET comment = LEFT(comment, LENGTH(comment) - 7) WHERE id = "111";
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
UPDATE _dynamodb.foo SET comment = LEFT(comment, LENGTH(comment) - 7) WHERE id = "99";
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
UPDATE _dynamodb.foo SET comment = LEFT(comment, LENGTH(comment) - 7) WHERE id = "123123";
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;

UPDATE _dynamodb.foo SET comment = CONCAT(comment," concat") WHERE other = 111;
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
UPDATE _dynamodb.foo SET comment = LEFT(comment, LENGTH(comment) - 7) WHERE other = 111;
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
UPDATE _dynamodb.foo SET comment = CONCAT(comment," concat") WHERE other = 999;
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
UPDATE _dynamodb.foo SET comment = LEFT(comment, LENGTH(comment) - 7) WHERE other = 999;
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;

--- reset
UPDATE _dynamodb.foo SET comment = "4 comment" WHERE id = "4";
UPDATE _dynamodb.foo SET comment = "99 comment with null" WHERE id = "99";
UPDATE _dynamodb.foo SET comment = "111 comment" WHERE id = "111";
UPDATE _dynamodb.foo SET comment = "112 comment" WHERE id = "112";
UPDATE _dynamodb.foo SET comment = "113 comment" WHERE id = "113";
UPDATE _dynamodb.foo SET comment = "114 comment with null" WHERE id = "114";
UPDATE _dynamodb.foo SET comment = "115 comment dup 222" WHERE id = "115";
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
