-- Raw engine: _dynamodb.foo (id varchar primary key, other int, comment varchar)
DELETE FROM _dynamodb.foo WHERE id LIKE "dz_raw_%";
INSERT INTO _dynamodb.foo (id, other) VALUES ("dz_raw_1", 1 / 0);
INSERT IGNORE INTO _dynamodb.foo (id, other) VALUES ("dz_raw_2", 1 / 0);
INSERT IGNORE INTO _dynamodb.foo (id, other) VALUES ("dz_raw_3", NULL);
SELECT id, other FROM _dynamodb.foo WHERE id LIKE "dz_raw_%" ORDER BY id;
DELETE FROM _dynamodb.foo WHERE id LIKE "dz_raw_%";
