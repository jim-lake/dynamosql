CREATE DATABASE IF NOT EXISTS _dynamodb;
USE _dynamodb;
DROP TABLE IF EXISTS foo;
-- DROP TABLE IF EXISTS bar;
-- DROP TABLE IF EXISTS other;
-- DROP TABLE IF EXISTS otherother;
SELECT SLEEP(3);
CREATE TABLE foo (id varchar(256) primary key, other int, comment varchar(256));
-- CREATE TABLE bar (id varchar(256) primary key, otherother varchar(256), comment varchar(256));
-- CREATE TABLE other (other int primary key, otherstring varchar(256));
-- CREATE TABLE otherother (otherother varchar(256) primary key, comment varchar(256));
SELECT SLEEP(3);

INSERT INTO foo (id, other, comment) VALUES
  ("4", 4, "4 comment"),
  ("99", null, "99 comment with null"),
  ("111", 111, "111 comment"),
  ("112", 222, "112 comment"),
  ("113", 333, "113 comment"),
  ("114", null, "114 comment with null")
;
