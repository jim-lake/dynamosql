CREATE TABLE _dynamodb.ctas_err (PRIMARY KEY (zz)) AS SELECT id FROM _dynamodb.foo;
CREATE TABLE _dynamodb.ctas_err (id VARCHAR(256) PRIMARY KEY) AS SELECT * FROM _dynamodb.no_such_table;
CREATE TABLE _dynamodb.ctas_err (id VARCHAR(256) PRIMARY KEY) AS SELECT id, id FROM _dynamodb.foo;
CREATE TABLE _dynamodb.ctas_err (k INT PRIMARY KEY) AS SELECT 1 AS k FROM _dynamodb.foo;
CREATE TABLE _dynamodb.ctas_err (id VARCHAR(256) PRIMARY KEY, other INT) AS SELECT NULL AS id, 1 AS other FROM _dynamodb.foo;
INSERT INTO _dynamodb.foo (id, other) VALUES (NULL, 1);
INSERT INTO _dynamodb.foo (id, other) VALUES ('ctas_null_a', 1), (NULL, 2);
CREATE TABLE _dynamodb.ctas_err (g INT PRIMARY KEY) AS SELECT comment AS g FROM _dynamodb.foo WHERE id = '111';
