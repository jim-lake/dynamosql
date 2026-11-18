USE _dynamodb;
DROP TABLE IF EXISTS show_cols_probe;
CREATE TEMPORARY TABLE show_cols_probe (
  id INT NOT NULL,
  name VARCHAR(20) NOT NULL,
  note CHAR(3),
  amount DECIMAL(10,2),
  flag BOOLEAN,
  PRIMARY KEY (id)
) ENGINE=MEMORY;
SHOW COLUMNS FROM show_cols_probe;
SHOW FIELDS FROM show_cols_probe;
SHOW COLUMNS FROM show_cols_probe FROM _dynamodb;
SHOW FULL COLUMNS FROM show_cols_probe;
SHOW FULL FIELDS FROM show_cols_probe IN _dynamodb;
DROP TEMPORARY TABLE show_cols_probe;
