-- Test resultObjects option (should return arrays instead of objects)
SELECT id, other FROM _dynamodb.foo WHERE id = "4";
