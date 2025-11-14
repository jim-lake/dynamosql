-- JOIN with WHERE clause
SELECT foo.id, foo.other, bar.other FROM _dynamodb.foo
  JOIN _dynamodb.bar ON foo.id = bar.id
  WHERE foo.other > 100
  ORDER BY foo.id;

-- JOIN with multiple conditions
SELECT foo.id, foo.other, bar.other FROM _dynamodb.foo
  JOIN _dynamodb.bar ON foo.id = bar.id AND foo.other = bar.other
  ORDER BY foo.id;

-- LEFT JOIN with NULL values
SELECT foo.id, foo.other, bar.id, bar.other FROM _dynamodb.foo
  LEFT JOIN _dynamodb.bar ON foo.id = bar.id
  WHERE foo.other IS NULL
  ORDER BY foo.id;

-- LEFT JOIN with WHERE on right table
SELECT foo.id, foo.other, bar.other FROM _dynamodb.foo
  LEFT JOIN _dynamodb.bar ON foo.id = bar.id
  WHERE bar.other > 100
  ORDER BY foo.id;

-- JOIN with expressions in ON clause
SELECT foo.id, foo.other, bar.other FROM _dynamodb.foo
  JOIN _dynamodb.bar ON CAST(foo.id AS SIGNED) = CAST(bar.id AS SIGNED)
  ORDER BY foo.id;

-- JOIN with column aliases
SELECT f.id AS foo_id, f.other AS foo_other, b.id AS bar_id, b.other AS bar_other
  FROM _dynamodb.foo f
  JOIN _dynamodb.bar b ON f.id = b.id
  ORDER BY f.id;

-- LEFT JOIN with column aliases
SELECT f.id AS foo_id, f.other AS foo_other, b.id AS bar_id, b.other AS bar_other
  FROM _dynamodb.foo f
  LEFT JOIN _dynamodb.bar b ON f.id = b.id
  ORDER BY f.id;

-- JOIN with aggregates
SELECT foo.id, SUM(bar.other) AS total
  FROM _dynamodb.foo
  JOIN _dynamodb.bar ON foo.id = bar.id
  GROUP BY foo.id
  ORDER BY foo.id;

-- JOIN with ORDER BY from both tables
SELECT foo.id, foo.other, bar.other FROM _dynamodb.foo
  JOIN _dynamodb.bar ON foo.id = bar.id
  ORDER BY foo.other DESC, bar.other ASC;

-- JOIN with LIMIT
SELECT foo.id, foo.other, bar.other FROM _dynamodb.foo
  JOIN _dynamodb.bar ON foo.id = bar.id
  ORDER BY foo.id
  LIMIT 2;

-- LEFT JOIN with LIMIT
SELECT foo.id, foo.other, bar.other FROM _dynamodb.foo
  LEFT JOIN _dynamodb.bar ON foo.id = bar.id
  ORDER BY foo.id
  LIMIT 3;
