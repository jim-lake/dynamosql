DROP DATABASE IF EXISTS _dynamodb;
CREATE DATABASE IF NOT EXISTS _dynamodb COLLATE UTF8MB4_0900_BIN;
USE _dynamodb;
DROP TABLE IF EXISTS foo;
DROP TABLE IF EXISTS bar;
DROP TABLE IF EXISTS other;
DROP TABLE IF EXISTS otherother;
DROP TABLE IF EXISTS `empty`;
CREATE TABLE foo (id VARCHAR(768) PRIMARY KEY, other JSON, comment JSON);
CREATE TABLE bar (id VARCHAR(768) PRIMARY KEY, other JSON, otherother JSON);
CREATE TABLE other (other DOUBLE PRIMARY KEY, otherother JSON, comment JSON);
CREATE TABLE otherother (otherother VARCHAR(768) PRIMARY KEY, comment JSON);
CREATE TABLE `empty` (id VARCHAR(768) PRIMARY KEY);

INSERT INTO foo (id, other, comment) VALUES
  ("4", '4', '"4 comment"'),
  ("99", null, '"99 comment with null"'),
  ("111", '111', '"111 comment"'),
  ("112", '222', '"112 comment"'),
  ("113", '333', '"113 comment"'),
  ("114", null, '"114 comment with null"'),
  ("115", '222', '"115 comment dup 222"')
;
INSERT INTO bar (id, other, otherother) VALUES
  ("111", '"111222"', '"foobar"'),
  ("114", '"111444"', '"777"'),
  ("123", '"456"', null),
  ("667", '"otherthing"', null),
  ("777", null, '"777fooo"')
;
INSERT INTO other (other, otherother, comment) VALUES
  (99999, '"foobar"', '"comment 99999"'),
  (11111111, '"777"', '"comment 11111111"')
;
