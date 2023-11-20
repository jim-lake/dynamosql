SELECT * FROM _dynamodb.foo ORDER BY id;
DROP TABLE IF EXISTS _dynamodb.test123;
USE _dynamodb;
SHOW TABLES;
CREATE TABLE test123 (id VARCHAR(256) PRIMARY KEY, other INT, comment VARCHAR(256))
  AS SELECT * FROM _dynamodb.foo
;
SELECT * FROM test123 ORDER BY id;
