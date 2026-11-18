CREATE DATABASE IF NOT EXISTS mem_default_db;
USE mem_default_db;
CREATE TEMPORARY TABLE def_t (
  id INT PRIMARY KEY COMMENT 'row id',
  i INT DEFAULT 5 COMMENT 'int col',
  s VARCHAR(10) DEFAULT 'abc' COMMENT 'str col',
  d DECIMAL(10,2) DEFAULT 1.5 COMMENT 'dec col',
  neg INT DEFAULT -3,
  f DOUBLE DEFAULT 2.5,
  nd INT DEFAULT NULL,
  flag BOOLEAN DEFAULT TRUE,
  nn INT NOT NULL DEFAULT 7,
  plain INT
);
SHOW FULL COLUMNS FROM def_t;
SHOW COLUMNS FROM def_t;
INSERT INTO def_t (id) VALUES (1);
INSERT INTO def_t (id, i) VALUES (2, 10);
INSERT INTO def_t (id, nn) VALUES (3, 8);
SELECT id, i, s, d, neg, f, nd, flag, nn, plain FROM def_t ORDER BY id;
USE _dynamodb;
DROP DATABASE mem_default_db;
