SELECT * FROM _dynamodb.foo JOIN _dynamodb.bar ON foo.id = bar.id ORDER BY foo.id ASC;
SELECT foo.*, bar.* FROM _dynamodb.foo JOIN _dynamodb.bar ON foo.id = bar.id ORDER BY foo.id ASC;
SELECT foo.* FROM _dynamodb.foo JOIN _dynamodb.bar ON foo.id = bar.id ORDER BY foo.id ASC;
SELECT bar.* FROM _dynamodb.foo JOIN _dynamodb.bar ON foo.id = bar.id ORDER BY foo.id ASC;
SELECT * FROM _dynamodb.foo LEFT JOIN _dynamodb.bar ON foo.id = bar.id ORDER BY foo.id ASC;
SELECT foo.*, bar.* FROM _dynamodb.foo LEFT JOIN _dynamodb.bar ON foo.id = bar.id ORDER BY foo.id ASC;
SELECT foo.* FROM _dynamodb.foo LEFT JOIN _dynamodb.bar ON foo.id = bar.id ORDER BY foo.id ASC;
SELECT bar.* FROM _dynamodb.foo LEFT JOIN _dynamodb.bar ON foo.id = bar.id ORDER BY foo.id ASC;
