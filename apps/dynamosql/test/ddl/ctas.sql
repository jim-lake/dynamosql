SELECT * FROM _dynamodb.foo ORDER BY id;
DROP TABLE IF EXISTS _dynamodb.test123;
DROP TABLE IF EXISTS _dynamodb.test1234;

CREATE TABLE _dynamodb.test123 (id VARCHAR(768) PRIMARY KEY, other JSON, comment JSON)
  AS SELECT * FROM _dynamodb.foo
;
SELECT * FROM _dynamodb.test123 ORDER BY id;
DROP TABLE IF EXISTS _dynamodb.test123;

CREATE TABLE _dynamodb.test1234 (id VARCHAR(768) PRIMARY KEY)
  AS SELECT * FROM _dynamodb.foo
;
SELECT * FROM _dynamodb.test1234 ORDER BY id;
DROP TABLE IF EXISTS _dynamodb.test1234;
