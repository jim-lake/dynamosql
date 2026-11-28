DROP TABLE IF EXISTS _dynamodb.raw_upd_ign;
CREATE TABLE _dynamodb.raw_upd_ign (id VARCHAR(768) PRIMARY KEY, other JSON, comment JSON);
INSERT INTO _dynamodb.raw_upd_ign (id, other, comment) VALUES ("ui_1", '1', '"a"'), ("ui_2", '2', '"b"');
UPDATE IGNORE _dynamodb.raw_upd_ign SET other = other + 10 WHERE id = "ui_1";
SELECT other = 11 AS assert_other, comment = 'a' AS assert_comment FROM _dynamodb.raw_upd_ign WHERE id = "ui_1";
SELECT other = 2 AS assert_other, comment = 'b' AS assert_comment FROM _dynamodb.raw_upd_ign WHERE id = "ui_2";
DROP TABLE _dynamodb.raw_upd_ign;
