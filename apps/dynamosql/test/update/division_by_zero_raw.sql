-- Raw engine: _dynamodb.foo (id varchar primary key, other int, comment varchar)
DELETE FROM _dynamodb.foo WHERE id LIKE "dz_raw_upd_%";
INSERT INTO _dynamodb.foo (id, other) VALUES ("dz_raw_upd_1", 1);
UPDATE _dynamodb.foo SET other = 1 / 0 WHERE id = "dz_raw_upd_1";
UPDATE IGNORE _dynamodb.foo SET other = 1 / 0 WHERE id = "dz_raw_upd_1";
SELECT id, other FROM _dynamodb.foo WHERE id LIKE "dz_raw_upd_%" ORDER BY id;
DELETE FROM _dynamodb.foo WHERE id LIKE "dz_raw_upd_%";
