-- Setup test data
DELETE FROM _dynamodb.foo WHERE id LIKE "wl%";
INSERT INTO _dynamodb.foo SET id = "wl1", other = 100, comment = "x";
INSERT INTO _dynamodb.foo SET id = "wl2", other = 200, comment = "x";
INSERT INTO _dynamodb.foo SET id = "wl3", other = 300, comment = "y";
INSERT INTO _dynamodb.foo SET id = "wl4", other = 150, comment = "x";

-- Test LEAD() default offset and default value
SELECT id, LEAD(other) OVER (ORDER BY other) AS l FROM _dynamodb.foo WHERE id LIKE "wl%" ORDER BY id;
SELECT id, LEAD(other, 1) OVER (ORDER BY other) AS l FROM _dynamodb.foo WHERE id LIKE "wl%" ORDER BY id;
SELECT id, LEAD(other, 2) OVER (ORDER BY other) AS l FROM _dynamodb.foo WHERE id LIKE "wl%" ORDER BY id;
SELECT id, LEAD(other, 0) OVER (ORDER BY other) AS l FROM _dynamodb.foo WHERE id LIKE "wl%" ORDER BY id;
SELECT id, LEAD(other, 1, -1) OVER (ORDER BY other) AS l FROM _dynamodb.foo WHERE id LIKE "wl%" ORDER BY id;
SELECT id, LEAD(other, 2, 0) OVER (ORDER BY other) AS l FROM _dynamodb.foo WHERE id LIKE "wl%" ORDER BY id;
SELECT id, LEAD(other, 0, -1) OVER (ORDER BY other) AS l FROM _dynamodb.foo WHERE id LIKE "wl%" ORDER BY id;

-- Test LEAD() with PARTITION BY and ORDER BY
SELECT id, LEAD(other, 1, -1) OVER (PARTITION BY comment ORDER BY other DESC) AS l FROM _dynamodb.foo WHERE id LIKE "wl%" ORDER BY id;
SELECT id, LEAD(other) OVER (PARTITION BY comment ORDER BY other) AS l FROM _dynamodb.foo WHERE id LIKE "wl%" ORDER BY id;
SELECT id, LEAD(other, 2) OVER (PARTITION BY comment ORDER BY other) AS l FROM _dynamodb.foo WHERE id LIKE "wl%" ORDER BY id;

-- Test LEAD() without ORDER BY (streams, lookahead per partition)
-- Only the count of NULL and default values is checked, since row order is not defined.
SELECT d.comment, COUNT(*) AS n, SUM(d.l IS NULL) AS nulls, SUM(d.l = -1) AS defaults FROM (SELECT comment, LEAD(other, 1, -1) OVER (PARTITION BY comment) AS l FROM _dynamodb.foo WHERE id LIKE "wl%") d GROUP BY d.comment ORDER BY d.comment;
SELECT d.comment, COUNT(*) AS n, SUM(d.l IS NULL) AS nulls FROM (SELECT comment, LEAD(other) OVER (PARTITION BY comment) AS l FROM _dynamodb.foo WHERE id LIKE "wl%") d GROUP BY d.comment ORDER BY d.comment;
SELECT COUNT(*) AS n, SUM(d.l = 0) AS zeros FROM (SELECT LEAD(other, 0, 0) OVER (PARTITION BY comment) AS l FROM _dynamodb.foo WHERE id LIKE "wl%") d;
SELECT d.comment, COUNT(*) AS n, SUM(d.l IS NULL) AS nulls, SUM(d.l = -1) AS defaults FROM (SELECT comment, LEAD(other, 2, -1) OVER (PARTITION BY comment) AS l FROM _dynamodb.foo WHERE id LIKE "wl%") d GROUP BY d.comment ORDER BY d.comment;

-- Test LEAD() ordering the output by the window result
SELECT id, LEAD(other, 1, -1) OVER (ORDER BY other) AS l FROM _dynamodb.foo WHERE id LIKE "wl%" ORDER BY l, id;

-- Test LEAD() and LAG() together in one query
SELECT id, LAG(other, 1, 0) OVER (PARTITION BY comment ORDER BY other) AS p, LEAD(other, 1, 0) OVER (PARTITION BY comment ORDER BY other) AS n FROM _dynamodb.foo WHERE id LIKE "wl%" ORDER BY id;

-- Test LEAD() and ROW_NUMBER() together in one query
SELECT id, ROW_NUMBER() OVER (PARTITION BY comment ORDER BY other) AS rn, LEAD(other, 1, 0) OVER (PARTITION BY comment ORDER BY other) AS l FROM _dynamodb.foo WHERE id LIKE "wl%" ORDER BY id;

-- Test LEAD() combined with an aggregate window
SELECT id, LEAD(other, 1, -1) OVER (ORDER BY other) AS l, SUM(other) OVER () AS s FROM _dynamodb.foo WHERE id LIKE "wl%" ORDER BY id;

-- Test LEAD() over NULL values
INSERT INTO _dynamodb.foo SET id = "wl5", other = null, comment = "x";
SELECT id, LEAD(other, 1, -1) OVER (ORDER BY id) AS l FROM _dynamodb.foo WHERE id LIKE "wl%" ORDER BY id;
SELECT id, LEAD(other, 1, -1) OVER (PARTITION BY comment ORDER BY id) AS l FROM _dynamodb.foo WHERE id LIKE "wl%" ORDER BY id;
DELETE FROM _dynamodb.foo WHERE id = "wl5";

-- Cleanup
DELETE FROM _dynamodb.foo WHERE id = "wl1";
DELETE FROM _dynamodb.foo WHERE id = "wl2";
DELETE FROM _dynamodb.foo WHERE id = "wl3";
DELETE FROM _dynamodb.foo WHERE id = "wl4";
