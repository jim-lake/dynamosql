DROP TABLE IF EXISTS _dynamodb.raw_ins_sel_src;
DROP TABLE IF EXISTS _dynamodb.raw_ins_sel;
CREATE TABLE _dynamodb.raw_ins_sel_src (id VARCHAR(768) PRIMARY KEY, other JSON, comment JSON);
CREATE TABLE _dynamodb.raw_ins_sel (id VARCHAR(768) PRIMARY KEY, other JSON, comment JSON);
INSERT INTO _dynamodb.raw_ins_sel_src (id, other, comment) VALUES ("s1", '456', '"src one"'), ("s2", '7', NULL), ("s3", NULL, '"src three"');

-- INSERT ... SELECT with CAST on the source columns
INSERT INTO _dynamodb.raw_ins_sel (id, other, comment) SELECT id, CAST(other AS SIGNED), comment FROM _dynamodb.raw_ins_sel_src;
SELECT id, other IS NULL AS assert_other, comment = 'src three' AS assert_comment FROM _dynamodb.raw_ins_sel WHERE id = "s3";

-- INSERT IGNORE ... SELECT with CAST and a computed literal, duplicate keys are skipped
INSERT IGNORE INTO _dynamodb.raw_ins_sel (id, other, comment) SELECT id, CAST(other AS SIGNED) + 1, "ignored" FROM _dynamodb.raw_ins_sel_src WHERE id = "s1";

-- INSERT ... SELECT with computed non-JSON expressions assigned to JSON columns
INSERT INTO _dynamodb.raw_ins_sel (id, other, comment) SELECT CONCAT(id, "_copy"), CAST(other AS SIGNED), CONCAT(comment, " copy") FROM _dynamodb.raw_ins_sel_src WHERE id = "s1";

DROP TABLE _dynamodb.raw_ins_sel;
DROP TABLE _dynamodb.raw_ins_sel_src;
