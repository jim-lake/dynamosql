BEGIN WORK;
UPDATE _dynamodb.foo SET comment = "begin work" WHERE id = "4";
COMMIT;
SELECT id, comment FROM _dynamodb.foo WHERE id = "4";
UPDATE _dynamodb.foo SET comment = "4 comment" WHERE id = "4";

CREATE DATABASE IF NOT EXISTS mem_gap_tx;
USE mem_gap_tx;
CREATE TEMPORARY TABLE tx (id INT PRIMARY KEY, v INT);
INSERT INTO tx (id, v) VALUES (1, 10);
START TRANSACTION;
UPDATE tx SET v = 20 WHERE id = 1;
ROLLBACK;
SELECT id, v FROM tx ORDER BY id;

BEGIN WORK;
UPDATE tx SET v = 30 WHERE id = 1;
ROLLBACK;
SELECT id, v FROM tx ORDER BY id;
