USE _dynamodb;
DROP TABLE IF EXISTS show_idx_probe;
CREATE TEMPORARY TABLE show_idx_probe (
  id INT NOT NULL,
  a VARCHAR(5),
  b INT,
  PRIMARY KEY (id),
  UNIQUE KEY ua (a) USING HASH,
  KEY kb (b) USING BTREE
) ENGINE=MEMORY;
SHOW INDEX FROM show_idx_probe;
SHOW INDEXES FROM show_idx_probe;
SHOW KEYS FROM show_idx_probe FROM _dynamodb;
SHOW INDEX FROM show_idx_probe IN _dynamodb;
DROP TEMPORARY TABLE show_idx_probe;
