DROP TABLE IF EXISTS _dynamodb.raw_jj_oo;
CREATE TABLE _dynamodb.raw_jj_oo (otherother VARCHAR(768) PRIMARY KEY, comment JSON);
INSERT INTO _dynamodb.raw_jj_oo (otherother, comment) VALUES ('foobar', '"comment foobar"'), ('777', '"comment 777"');

SELECT COUNT(*) = 2 AS assert_true FROM _dynamodb.bar JOIN _dynamodb.raw_jj_oo ON JSON_UNQUOTE(bar.otherother) = raw_jj_oo.otherother;
SELECT COUNT(*) = 2 AS assert_true FROM _dynamodb.foo JOIN _dynamodb.bar USING (id) JOIN _dynamodb.raw_jj_oo ON JSON_UNQUOTE(bar.otherother) = raw_jj_oo.otherother;
SELECT COUNT(*) = 7 AS assert_true FROM _dynamodb.foo LEFT JOIN _dynamodb.bar USING (id) LEFT JOIN _dynamodb.raw_jj_oo ON JSON_UNQUOTE(bar.otherother) = raw_jj_oo.otherother;
SELECT COUNT(raw_jj_oo.comment) = 2 AS assert_true FROM _dynamodb.foo LEFT JOIN _dynamodb.bar USING (id) LEFT JOIN _dynamodb.raw_jj_oo ON JSON_UNQUOTE(bar.otherother) = raw_jj_oo.otherother;

DROP TABLE _dynamodb.raw_jj_oo;
