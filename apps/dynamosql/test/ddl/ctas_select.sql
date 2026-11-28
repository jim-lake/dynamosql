DROP TABLE IF EXISTS _dynamodb.ctas_empty;
CREATE TABLE _dynamodb.ctas_empty (id VARCHAR(768) PRIMARY KEY, n JSON)
  AS SELECT id, other AS n FROM _dynamodb.foo WHERE 1 = 0;
SELECT COUNT(*) AS c FROM _dynamodb.ctas_empty;
DROP TABLE IF EXISTS _dynamodb.ctas_empty;

DROP TABLE IF EXISTS _dynamodb.ctas_nulls;
CREATE TABLE _dynamodb.ctas_nulls (id VARCHAR(768) PRIMARY KEY, other JSON)
  AS SELECT id, other FROM _dynamodb.foo WHERE other IS NULL;
SELECT * FROM _dynamodb.ctas_nulls ORDER BY id;
DROP TABLE IF EXISTS _dynamodb.ctas_nulls;

DROP TABLE IF EXISTS _dynamodb.ctas_if_not_exists;
CREATE TABLE _dynamodb.ctas_if_not_exists (id VARCHAR(768) PRIMARY KEY, other JSON)
  AS SELECT id, other FROM _dynamodb.foo;
CREATE TABLE IF NOT EXISTS _dynamodb.ctas_if_not_exists (id VARCHAR(768) PRIMARY KEY, other JSON)
  AS SELECT id, other FROM _dynamodb.foo WHERE id = '111';
SELECT COUNT(*) AS c FROM _dynamodb.ctas_if_not_exists;
DROP TABLE IF EXISTS _dynamodb.ctas_if_not_exists;

DROP TABLE IF EXISTS _dynamodb.ctas_ord;
CREATE TABLE _dynamodb.ctas_ord (id VARCHAR(768) PRIMARY KEY, other JSON)
  AS SELECT id, other FROM _dynamodb.foo ORDER BY id DESC LIMIT 2;
SELECT * FROM _dynamodb.ctas_ord ORDER BY id;
DROP TABLE IF EXISTS _dynamodb.ctas_ord;

DROP TABLE IF EXISTS _dynamodb.ctas_left;
CREATE TABLE _dynamodb.ctas_left (id VARCHAR(768) PRIMARY KEY, foo_other JSON, bar_otherother JSON)
  AS SELECT foo.id, foo.other AS foo_other, bar.otherother AS bar_otherother
     FROM _dynamodb.foo LEFT JOIN _dynamodb.bar ON foo.id = bar.id;
SELECT * FROM _dynamodb.ctas_left ORDER BY id;
DROP TABLE IF EXISTS _dynamodb.ctas_left;

DROP TABLE IF EXISTS _dynamodb.ctas_int_key;
CREATE TABLE _dynamodb.ctas_int_key (g DOUBLE PRIMARY KEY) AS SELECT id AS g FROM _dynamodb.foo WHERE id IN ('111', '112');
SELECT * FROM _dynamodb.ctas_int_key ORDER BY g;
DROP TABLE IF EXISTS _dynamodb.ctas_int_key;
