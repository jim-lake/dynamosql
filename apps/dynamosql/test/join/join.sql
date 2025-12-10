SELECT * FROM _dynamodb.foo JOIN _dynamodb.bar ON foo.id = bar.id ORDER BY foo.id ASC;
SELECT foo.*, bar.* FROM _dynamodb.foo JOIN _dynamodb.bar ON foo.id = bar.id ORDER BY foo.id ASC;
SELECT foo.* FROM _dynamodb.foo JOIN _dynamodb.bar ON foo.id = bar.id ORDER BY foo.id ASC;
SELECT bar.* FROM _dynamodb.foo JOIN _dynamodb.bar ON foo.id = bar.id ORDER BY foo.id ASC;
SELECT * FROM _dynamodb.foo LEFT JOIN _dynamodb.bar ON foo.id = bar.id ORDER BY foo.id ASC;
SELECT foo.*, bar.* FROM _dynamodb.foo LEFT JOIN _dynamodb.bar ON foo.id = bar.id ORDER BY foo.id ASC;
SELECT foo.* FROM _dynamodb.foo LEFT JOIN _dynamodb.bar ON foo.id = bar.id ORDER BY foo.id ASC;
SELECT bar.* FROM _dynamodb.foo LEFT JOIN _dynamodb.bar ON foo.id = bar.id ORDER BY foo.id ASC;
SELECT * FROM _dynamodb.foo, _dynamodb.bar WHERE foo.id = bar.id ORDER BY foo.id ASC;
SELECT foo.*, bar.* FROM _dynamodb.foo, _dynamodb.bar WHERE foo.id = bar.id ORDER BY foo.id ASC;
SELECT foo.* FROM _dynamodb.foo, _dynamodb.bar WHERE foo.id = bar.id ORDER BY foo.id ASC;
SELECT bar.* FROM _dynamodb.foo, _dynamodb.bar WHERE foo.id = bar.id ORDER BY foo.id ASC;
SELECT * FROM _dynamodb.foo, _dynamodb.bar ORDER BY foo.id ASC, bar.id ASC;
SELECT foo.*, bar.* FROM _dynamodb.foo, _dynamodb.bar ORDER BY foo.id ASC, bar.id ASC;
SELECT foo.* FROM _dynamodb.foo, _dynamodb.bar ORDER BY foo.id ASC, bar.id ASC;
SELECT bar.* FROM _dynamodb.foo, _dynamodb.bar ORDER BY foo.id ASC, bar.id ASC;

SELECT s1.id AS s1id,  s2.id as s2id, s1.other AS s1other, s2.other AS s2other
  FROM _dynamodb.bar s1
  LEFT JOIN _dynamodb.bar s2 ON s2.otherother = s1.id
  ORDER BY s1id ASC;
