-- CROSS JOIN with an ON condition
SELECT f.id AS fid, b.other AS bother FROM _dynamodb.foo f CROSS JOIN _dynamodb.bar b ON f.id = b.id ORDER BY fid;
SELECT f.id AS fid, b.id AS bid FROM _dynamodb.foo f CROSS JOIN _dynamodb.bar b ON f.other > 100 AND b.id = "123" ORDER BY fid;

-- Parenthesized table reference
SELECT f.id AS fid FROM (_dynamodb.foo f) ORDER BY fid;
SELECT f.id AS fid, b.id AS bid FROM (_dynamodb.foo f) JOIN _dynamodb.bar b ON f.id = b.id ORDER BY fid;
