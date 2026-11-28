DROP TABLE IF EXISTS _dynamodb.raw_odku;
CREATE TABLE _dynamodb.raw_odku (id VARCHAR(768) PRIMARY KEY, other JSON, comment JSON);

INSERT INTO _dynamodb.raw_odku (id, other, comment) VALUES ("o2", '10', '"two"');
INSERT INTO _dynamodb.raw_odku (id, other, comment) VALUES ("o6", '3', '"six"');

INSERT INTO _dynamodb.raw_odku (id, other, comment) VALUES ("o4", '4', '"four"'), ("o4", '4', '"four2"') ON DUPLICATE KEY UPDATE other = other + 1;
SELECT other = 5 AS assert_other, comment = 'four' AS assert_comment FROM _dynamodb.raw_odku WHERE id = "o4";

DROP TABLE _dynamodb.raw_odku;
