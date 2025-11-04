SELECT * FROM _dynamodb.foo ORDER BY id ASC;
SELECT foo.*, bar.* FROM _dynamodb.foo JOIN _dynamodb.bar ON foo.id = bar.id ORDER BY foo.id ASC;
