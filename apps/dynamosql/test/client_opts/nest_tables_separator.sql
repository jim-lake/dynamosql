-- nestTables string separator: keys are table name + separator + column name
SELECT foo.*, bar.* FROM _dynamodb.foo JOIN _dynamodb.bar ON foo.id = bar.id ORDER BY foo.id ASC;
