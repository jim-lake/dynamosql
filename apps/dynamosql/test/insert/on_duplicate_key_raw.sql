-- Raw engine: _dynamodb.foo (id varchar primary key, other JSON, comment JSON)
DELETE FROM _dynamodb.foo WHERE id LIKE "odku_%";
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_1", '1', '"first"') ON DUPLICATE KEY UPDATE other = other;
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_1", '5', '"second"') ON DUPLICATE KEY UPDATE other = other;
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_1", '5', '"third"') ON DUPLICATE KEY UPDATE comment = VALUES(comment);
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_2", '20', '"two"'), ("odku_1", '100', '"again"'), ("odku_3", '30', '"three"') ON DUPLICATE KEY UPDATE comment = VALUES(comment);
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_2", '1', '"a"'), ("odku_2", '2', '"b"') ON DUPLICATE KEY UPDATE comment = VALUES(comment);
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_3", NULL, NULL) ON DUPLICATE KEY UPDATE comment = NULL;
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_3", '2', '"back"') ON DUPLICATE KEY UPDATE comment = VALUES(comment), other = VALUES(other);
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_4", '4', '"four"') ON DUPLICATE KEY UPDATE other = VALUES(other);
INSERT INTO _dynamodb.foo (id, other, comment) SELECT "odku_5", '50', '"fifty"' ON DUPLICATE KEY UPDATE other = VALUES(other);
INSERT INTO _dynamodb.foo (id, other, comment) SELECT "odku_5", '50', '"fifty"' ON DUPLICATE KEY UPDATE other = VALUES(other);
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;
INSERT INTO _dynamodb.foo SET id = "odku_5", other = '7', comment = '"set"' ON DUPLICATE KEY UPDATE other = VALUES(other);
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;
DELETE FROM _dynamodb.foo WHERE id LIKE "odku_%";
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;

-- Same-row duplicates with literal values
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_b", '7', '"k"') ON DUPLICATE KEY UPDATE comment = VALUES(comment);
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_b", '7', '"k2"') ON DUPLICATE KEY UPDATE comment = VALUES(comment);
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_b", '7', '"k2"') ON DUPLICATE KEY UPDATE comment = VALUES(comment);
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_d", '5', '"x"') ON DUPLICATE KEY UPDATE other = '5';
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_d", '5', '"y"') ON DUPLICATE KEY UPDATE other = '5';
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_g", '1', '"a"'), ("odku_h", '1', '"b"') ON DUPLICATE KEY UPDATE comment = VALUES(comment);
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_g", '1', '"a"'), ("odku_h", '1', '"b"') ON DUPLICATE KEY UPDATE comment = VALUES(comment);
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_r", '1', '"a"'), ("odku_r", '1', '"b"') ON DUPLICATE KEY UPDATE comment = VALUES(comment);
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;

-- Batch with a mix of new and existing rows
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_i", '1', '"x"') ON DUPLICATE KEY UPDATE other = other;
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_j", '1', '"a"'), ("odku_i", '1', '"z"') ON DUPLICATE KEY UPDATE comment = '"changed"';
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_k", '9', '"a"') ON DUPLICATE KEY UPDATE other = '11', comment = '"b"';
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;

DELETE FROM _dynamodb.foo WHERE id LIKE "odku_%";
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;
