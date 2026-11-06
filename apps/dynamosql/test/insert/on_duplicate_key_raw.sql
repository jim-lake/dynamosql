-- Raw engine: _dynamodb.foo (id varchar primary key, other int, comment varchar)
DELETE FROM _dynamodb.foo WHERE id LIKE "odku_%";
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_1", 1, "first") ON DUPLICATE KEY UPDATE other = other + 1;
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_1", 5, "second") ON DUPLICATE KEY UPDATE other = other + 1;
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_1", 5, "second") ON DUPLICATE KEY UPDATE other = other;
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_1", 5, "third") ON DUPLICATE KEY UPDATE comment = VALUES(comment);
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_1", 5, "third") ON DUPLICATE KEY UPDATE comment = VALUES(comment), other = VALUES(other) + other;
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_2", 20, "two"), ("odku_1", 100, "again"), ("odku_3", 30, "three") ON DUPLICATE KEY UPDATE other = other + VALUES(other);
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_2", 1, "a"), ("odku_2", 2, "b") ON DUPLICATE KEY UPDATE comment = CONCAT(comment, VALUES(comment));
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_3", 1, NULL) ON DUPLICATE KEY UPDATE comment = NULL;
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_3", 2, "back") ON DUPLICATE KEY UPDATE comment = VALUES(comment), other = IFNULL(other, 0) + 1;
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_4", 4, "four") ON DUPLICATE KEY UPDATE other = other + 1;
INSERT INTO _dynamodb.foo (id, other, comment) SELECT "odku_5", 50, "fifty" ON DUPLICATE KEY UPDATE other = other + 1;
INSERT INTO _dynamodb.foo (id, other, comment) SELECT "odku_5", 50, "fifty" ON DUPLICATE KEY UPDATE other = other + 1;
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;
INSERT INTO _dynamodb.foo SET id = "odku_5", other = 7, comment = "set" ON DUPLICATE KEY UPDATE other = VALUES(other) * 2;
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;
DELETE FROM _dynamodb.foo WHERE id LIKE "odku_%";
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;

-- Raw engine path A: one UpdateItem per row. A SET value must equal the inserted value,
-- or an increment must equal the inserted value.
DELETE FROM _dynamodb.foo WHERE id LIKE "odku_%";
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_a", 1, "x") ON DUPLICATE KEY UPDATE other = other + 1;
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_a", 1, "y") ON DUPLICATE KEY UPDATE other = other + 1;
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_a", -1, "z") ON DUPLICATE KEY UPDATE other = other - 1;
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_b", 7, "k") ON DUPLICATE KEY UPDATE comment = VALUES(comment);
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_b", 7, "k2") ON DUPLICATE KEY UPDATE comment = VALUES(comment);
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_b", 7, "k2") ON DUPLICATE KEY UPDATE comment = VALUES(comment);
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_c", 3, "new") ON DUPLICATE KEY UPDATE other = other + 1;
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_c", 3, "ignored") ON DUPLICATE KEY UPDATE other = other + 1;
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_d", 5, "x") ON DUPLICATE KEY UPDATE other = 5;
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_d", 5, "y") ON DUPLICATE KEY UPDATE other = 5;
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_g", 1, "a"), ("odku_h", 1, "b") ON DUPLICATE KEY UPDATE other = other + 1;
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_g", 1, "a"), ("odku_h", 1, "b") ON DUPLICATE KEY UPDATE other = other + 1;
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_r", 1, "a"), ("odku_r", 1, "b") ON DUPLICATE KEY UPDATE other = other + 1;
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;

-- Raw engine path B: batch PartiQL UPDATE, then batch INSERT for rows that did not exist.
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_i", 1, "x") ON DUPLICATE KEY UPDATE other = other + 5;
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_i", 1, "x") ON DUPLICATE KEY UPDATE other = other + 5;
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_j", 1, "a"), ("odku_i", 1, "z") ON DUPLICATE KEY UPDATE other = other + 5;
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_j", 1, "a"), ("odku_i", 1, "z") ON DUPLICATE KEY UPDATE comment = "changed";
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_k", 9, "a") ON DUPLICATE KEY UPDATE other = other + 2, comment = "b";
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;

-- Raw engine path C: an expression that cannot be translated to PartiQL is evaluated after reading the rows.
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_l", 1, "x") ON DUPLICATE KEY UPDATE other = IFNULL(other, 0) + 1;
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_l", 4, "x"), ("odku_m", 4, "x") ON DUPLICATE KEY UPDATE other = IFNULL(other, 0) + 1;
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_n", 1, "a"), ("odku_n", 1, "b"), ("odku_n", 1, "c") ON DUPLICATE KEY UPDATE other = IFNULL(other, 0) + 10;
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_l", 2, "a"), ("odku_l", 2, "b") ON DUPLICATE KEY UPDATE other = IFNULL(other, 0) + 1, comment = VALUES(comment);
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;
INSERT INTO _dynamodb.foo (id, other, comment) VALUES ("odku_o", 1, "a"), ("odku_p", 2, "b") ON DUPLICATE KEY UPDATE other = IFNULL(other, 0) + 1;
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;
INSERT INTO _dynamodb.foo (id, other, comment) SELECT "odku_q", 6, "sel" ON DUPLICATE KEY UPDATE other = IFNULL(other, 0) + 1;
INSERT INTO _dynamodb.foo (id, other, comment) SELECT "odku_q", 6, "sel" ON DUPLICATE KEY UPDATE other = IFNULL(other, 0) + 1;
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;
DELETE FROM _dynamodb.foo WHERE id LIKE "odku_%";
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "odku_%" ORDER BY id;
