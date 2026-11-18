USE _dynamodb;
DROP TABLE IF EXISTS show_create_probe;
CREATE TEMPORARY TABLE show_create_probe (
  id INT NOT NULL,
  a VARCHAR(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  b INT,
  PRIMARY KEY (id),
  UNIQUE KEY ua (a) USING HASH,
  KEY kb (b) USING BTREE,
  KEY kb2 (b)
) ENGINE=MEMORY;
SHOW CREATE TABLE show_create_probe;
DROP TEMPORARY TABLE show_create_probe;
