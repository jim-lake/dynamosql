DROP TABLE IF EXISTS _dynamodb.raw_upd_edge;
CREATE TABLE _dynamodb.raw_upd_edge (id VARCHAR(768) PRIMARY KEY, other JSON, comment JSON);
INSERT INTO _dynamodb.raw_upd_edge (id, other, comment) VALUES
  ("upd_edge1", '150', '"edge test 1"'),
  ("upd_edge2", '200', '"restored"'),
  ("upd_edge3", '350', '"restored 3"');

UPDATE _dynamodb.raw_upd_edge SET other = other + 10 WHERE id = "upd_edge1";
UPDATE _dynamodb.raw_upd_edge SET other = other * 2 WHERE id = "upd_edge2";
UPDATE _dynamodb.raw_upd_edge SET other = other - 50 WHERE id = "upd_edge3";
SELECT other = 160 AS assert_other, comment = 'edge test 1' AS assert_comment FROM _dynamodb.raw_upd_edge WHERE id = "upd_edge1";
SELECT other = 400 AS assert_other, comment = 'restored' AS assert_comment FROM _dynamodb.raw_upd_edge WHERE id = "upd_edge2";
SELECT other = 300 AS assert_other, comment = 'restored 3' AS assert_comment FROM _dynamodb.raw_upd_edge WHERE id = "upd_edge3";

UPDATE _dynamodb.raw_upd_edge SET comment = CONCAT(comment, " updated") WHERE id = "upd_edge1";
UPDATE _dynamodb.raw_upd_edge SET comment = LOWER(comment) WHERE id = "upd_edge2";
UPDATE _dynamodb.raw_upd_edge SET comment = LEFT(comment, 10) WHERE id = "upd_edge3";
SELECT other = 160 AS assert_other, comment = '"edge test 1" updated' AS assert_comment FROM _dynamodb.raw_upd_edge WHERE id = "upd_edge1";
SELECT other = 400 AS assert_other, comment = 'restored' AS assert_comment FROM _dynamodb.raw_upd_edge WHERE id = "upd_edge2";
SELECT other = 300 AS assert_other, comment = '"restored ' AS assert_comment FROM _dynamodb.raw_upd_edge WHERE id = "upd_edge3";

UPDATE _dynamodb.raw_upd_edge SET other = COALESCE(other, 999) WHERE id = "upd_edge1";
UPDATE _dynamodb.raw_upd_edge SET comment = COALESCE(comment, "default") WHERE id = "upd_edge2";
SELECT other = 160 AS assert_other, comment = '"edge test 1" updated' AS assert_comment FROM _dynamodb.raw_upd_edge WHERE id = "upd_edge1";
SELECT other = 400 AS assert_other, comment = 'restored' AS assert_comment FROM _dynamodb.raw_upd_edge WHERE id = "upd_edge2";

UPDATE _dynamodb.raw_upd_edge SET comment = CAST(other AS CHAR) WHERE id = "upd_edge1";
SELECT other = 160 AS assert_other, comment = 160 AS assert_comment FROM _dynamodb.raw_upd_edge WHERE id = "upd_edge1";

UPDATE _dynamodb.raw_upd_edge SET other = other + 100, comment = CONCAT("multi: ", comment) WHERE id = "upd_edge2";
SELECT other = 500 AS assert_other, comment = 'multi: "restored"' AS assert_comment FROM _dynamodb.raw_upd_edge WHERE id = "upd_edge2";

DROP TABLE _dynamodb.raw_upd_edge;
