SELECT * FROM _dynamodb.foo ORDER BY id;
DROP TABLE IF EXISTS _dynamodb.test123;
DROP TABLE IF EXISTS _dynamodb.test1234;

CREATE TABLE _dynamodb.test123 (id VARCHAR(256) PRIMARY KEY, other INT, comment VARCHAR(256))
  AS SELECT * FROM _dynamodb.foo
;
SELECT * FROM _dynamodb.test123 ORDER BY id;
DROP TABLE IF EXISTS _dynamodb.test123;

CREATE TABLE _dynamodb.test1234 (id VARCHAR(256) PRIMARY KEY)
  AS SELECT * FROM _dynamodb.foo
;
SELECT * FROM _dynamodb.test1234 ORDER BY id;
DROP TABLE IF EXISTS _dynamodb.test1234;
