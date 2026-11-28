DROP TABLE IF EXISTS _dynamodb.raw_pad_ins;
CREATE TABLE _dynamodb.raw_pad_ins (id VARCHAR(768) PRIMARY KEY, other JSON, comment JSON);
INSERT INTO _dynamodb.raw_pad_ins (id, other, comment) VALUES ("pad_a", '1', '"base"');
INSERT INTO _dynamodb.raw_pad_ins (id, other, comment) VALUES ("pad_a  ", '9', '"dup"') ON DUPLICATE KEY UPDATE other = other + 10;
SELECT other = 1 AS assert_other, comment = 'base' AS assert_comment FROM _dynamodb.raw_pad_ins WHERE id = "pad_a";
DROP TABLE _dynamodb.raw_pad_ins;
