-- Cleanup any leftover test data first
DELETE FROM _dynamodb.foo WHERE id IN ("tx1", "tx5", "tx6");

-- Basic transaction - COMMIT
BEGIN;
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("tx1", 1000, "transaction test 1");
COMMIT;
SELECT id, other, comment FROM _dynamodb.foo WHERE id = "tx1";

-- Transaction with UPDATE - COMMIT
BEGIN;
UPDATE _dynamodb.foo SET comment = "updated in transaction" WHERE id = "tx1";
COMMIT;
SELECT id, other, comment FROM _dynamodb.foo WHERE id = "tx1";

-- Transaction with DELETE - COMMIT
BEGIN;
DELETE FROM _dynamodb.foo WHERE id = "tx1";
COMMIT;
SELECT id, other, comment FROM _dynamodb.foo WHERE id = "tx1";

-- Transaction with multiple operations - COMMIT
BEGIN;
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("tx5", 5000, "transaction test 5");
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("tx6", 6000, "transaction test 6");
UPDATE _dynamodb.foo SET comment = "committed" WHERE id = "tx5";
COMMIT;
SELECT id, other, comment FROM _dynamodb.foo WHERE id IN ("tx5", "tx6") ORDER BY id;

-- Cleanup
DELETE FROM _dynamodb.foo WHERE id IN ("tx1", "tx5", "tx6");
