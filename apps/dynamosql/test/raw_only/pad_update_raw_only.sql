DROP TABLE IF EXISTS _dynamodb.raw_pad_upd;
CREATE TABLE _dynamodb.raw_pad_upd (id VARCHAR(768) PRIMARY KEY, other JSON, comment JSON);
INSERT INTO _dynamodb.raw_pad_upd (id, other, comment) VALUES ("pu_1", '1', '"x"');
UPDATE _dynamodb.raw_pad_upd SET other = other + 10 WHERE id = "pu_1";
SELECT other = 11 AS assert_other, comment = 'x' AS assert_comment FROM _dynamodb.raw_pad_upd WHERE id = "pu_1";
DROP TABLE _dynamodb.raw_pad_upd;
