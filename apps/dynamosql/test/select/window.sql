-- Setup test data
DELETE FROM _dynamodb.foo WHERE id LIKE "win%";
INSERT INTO _dynamodb.foo SET id = "win1", other = 100, comment = "test";
INSERT INTO _dynamodb.foo SET id = "win2", other = 200, comment = "test";
INSERT INTO _dynamodb.foo SET id = "win3", other = 300, comment = "test";
INSERT INTO _dynamodb.foo SET id = "win4", other = 150, comment = "other";

-- Test SUM OVER () on every row
SELECT id, SUM(other) OVER () AS s FROM _dynamodb.foo WHERE id LIKE "win%" ORDER BY id;
SELECT SUM(other) OVER () AS s FROM _dynamodb.foo WHERE id LIKE "win%" ORDER BY s;
SELECT id, SUM(other) OVER () AS s FROM _dynamodb.foo WHERE id = "win1";
SELECT id, SUM(other) OVER () AS s FROM _dynamodb.foo WHERE id = "nope";
SELECT SUM(other) OVER () AS s FROM _dynamodb.foo WHERE id = "nope";
SELECT id, SUM(other) OVER () AS s FROM _dynamodb.foo WHERE id LIKE "win%" ORDER BY id LIMIT 2;
SELECT id, SUM(other) OVER () AS s FROM _dynamodb.foo WHERE id LIKE "win%" ORDER BY id LIMIT 1, 2;
SELECT id, SUM(other) OVER () + 1 AS s FROM _dynamodb.foo WHERE id LIKE "win%" ORDER BY id;
SELECT id, 1 + SUM(other) OVER () AS s FROM _dynamodb.foo WHERE id LIKE "win%" ORDER BY id;
SELECT id, SUM(other) OVER () * 2 AS s FROM _dynamodb.foo WHERE id LIKE "win%" ORDER BY id;
SELECT id, SUM(other) OVER () - other AS s FROM _dynamodb.foo WHERE id LIKE "win%" ORDER BY id;
SELECT id, SUM(other) OVER () AS s, other FROM _dynamodb.foo WHERE id LIKE "win%" ORDER BY id;
SELECT other, SUM(other) OVER () AS s FROM _dynamodb.foo WHERE id LIKE "win%" ORDER BY other;

-- Test SUM OVER () with GROUP BY
SELECT comment, SUM(SUM(other)) OVER () AS s FROM _dynamodb.foo WHERE id LIKE "win%" GROUP BY comment ORDER BY comment;
SELECT comment, COUNT(*) OVER () AS n FROM _dynamodb.foo WHERE id LIKE "win%" GROUP BY comment ORDER BY comment;

-- Test SUM OVER () with HAVING
SELECT id, SUM(other) OVER () AS s FROM _dynamodb.foo WHERE id LIKE "win%" HAVING id > "win2" ORDER BY id;
SELECT id AS x, SUM(other) OVER () AS s FROM _dynamodb.foo WHERE id LIKE "win%" HAVING x > "win2" ORDER BY id;
SELECT id, SUM(other) OVER () AS s FROM _dynamodb.foo WHERE id LIKE "win%" HAVING id > "zzz" ORDER BY id;
SELECT id, SUM(other) OVER () AS s FROM _dynamodb.foo WHERE id LIKE "win%" HAVING id = "win1" ORDER BY id;

-- Test SUM OVER () in ORDER BY expressions over sorted output
SELECT id, SUM(other) OVER () AS s FROM _dynamodb.foo WHERE id LIKE "win%" ORDER BY s DESC, id;

-- Test SUM OVER () in a derived table
SELECT d.id, d.s FROM (SELECT id, SUM(other) OVER () AS s FROM _dynamodb.foo WHERE id LIKE "win%") d ORDER BY d.id;
SELECT d.s FROM (SELECT SUM(other) OVER () AS s FROM _dynamodb.foo WHERE id LIKE "win%") d ORDER BY d.s LIMIT 1;

-- Test COUNT OVER () and COUNT(column) OVER ()
SELECT id, COUNT(*) OVER () AS n FROM _dynamodb.foo WHERE id LIKE "win%" ORDER BY id;
SELECT id, COUNT(other) OVER () AS n FROM _dynamodb.foo WHERE id LIKE "win%" ORDER BY id;

-- Test MIN OVER () and MAX OVER ()
SELECT id, MIN(other) OVER () AS mn FROM _dynamodb.foo WHERE id LIKE "win%" ORDER BY id;
SELECT id, MAX(other) OVER () AS mx FROM _dynamodb.foo WHERE id LIKE "win%" ORDER BY id;
SELECT id, MIN(comment) OVER () AS mn, MAX(comment) OVER () AS mx FROM _dynamodb.foo WHERE id LIKE "win%" ORDER BY id;

-- Test NULL handling for SUM OVER ()
INSERT INTO _dynamodb.foo SET id = "win5", other = null, comment = "nullish";
SELECT id, SUM(other) OVER () AS s FROM _dynamodb.foo WHERE id LIKE "win%" ORDER BY id;
SELECT id, COUNT(other) OVER () AS n FROM _dynamodb.foo WHERE id LIKE "win%" ORDER BY id;
SELECT id, COUNT(*) OVER () AS n FROM _dynamodb.foo WHERE id LIKE "win%" ORDER BY id;
SELECT id, SUM(other) OVER () AS s FROM _dynamodb.foo WHERE id = "win5";
DELETE FROM _dynamodb.foo WHERE id = "win5";

-- Cleanup
DELETE FROM _dynamodb.foo WHERE id = "win1";
DELETE FROM _dynamodb.foo WHERE id = "win2";
DELETE FROM _dynamodb.foo WHERE id = "win3";
DELETE FROM _dynamodb.foo WHERE id = "win4";
