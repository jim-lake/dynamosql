-- Setup test data
DELETE FROM _dynamodb.foo WHERE id LIKE "rl%";
INSERT INTO _dynamodb.foo SET id = "rl1", other = 100, comment = "x";
INSERT INTO _dynamodb.foo SET id = "rl2", other = 200, comment = "x";
INSERT INTO _dynamodb.foo SET id = "rl3", other = 300, comment = "y";
INSERT INTO _dynamodb.foo SET id = "rl4", other = 150, comment = "x";

-- Test ROW_NUMBER() without ORDER BY (streams, one counter)
SELECT id, ROW_NUMBER() OVER () AS rn FROM _dynamodb.foo WHERE id = "rl1";
SELECT id, ROW_NUMBER() OVER () AS rn FROM _dynamodb.foo WHERE id = "nope";

-- Test ROW_NUMBER() without ORDER BY over many rows (streams, one counter)
-- Row order without ORDER BY is not defined, so the tests check order-independent results.
SELECT MIN(d.rn) AS mn, MAX(d.rn) AS mx, COUNT(*) AS n FROM (SELECT ROW_NUMBER() OVER () AS rn FROM _dynamodb.foo WHERE id LIKE "rl%") d;
SELECT MIN(d.rn) AS mn, MAX(d.rn) AS mx, COUNT(*) AS n FROM (SELECT ROW_NUMBER() OVER () AS rn FROM _dynamodb.foo WHERE id LIKE "nope%") d;

-- Test ROW_NUMBER() with PARTITION BY and no ORDER BY (streams, counter per partition)
SELECT d.comment, MIN(d.rn) AS mn, MAX(d.rn) AS mx, COUNT(*) AS n FROM (SELECT comment, ROW_NUMBER() OVER (PARTITION BY comment) AS rn FROM _dynamodb.foo WHERE id LIKE "rl%") d GROUP BY d.comment ORDER BY d.comment;

-- Test ROW_NUMBER() with ORDER BY (collects, sorts each partition)
SELECT id, ROW_NUMBER() OVER (ORDER BY other) AS rn FROM _dynamodb.foo WHERE id LIKE "rl%" ORDER BY id;
SELECT id, ROW_NUMBER() OVER (ORDER BY other DESC) AS rn FROM _dynamodb.foo WHERE id LIKE "rl%" ORDER BY id;
SELECT id, ROW_NUMBER() OVER (PARTITION BY comment ORDER BY other) AS rn FROM _dynamodb.foo WHERE id LIKE "rl%" ORDER BY id;
SELECT id, ROW_NUMBER() OVER (PARTITION BY comment ORDER BY other DESC) AS rn FROM _dynamodb.foo WHERE id LIKE "rl%" ORDER BY id;
SELECT id, ROW_NUMBER() OVER (ORDER BY other) AS rn FROM _dynamodb.foo WHERE id LIKE "rl%" ORDER BY rn;

-- Test LAG() default offset and default value
SELECT id, LAG(other) OVER (ORDER BY other) AS l FROM _dynamodb.foo WHERE id LIKE "rl%" ORDER BY id;
SELECT id, LAG(other, 1) OVER (ORDER BY other) AS l FROM _dynamodb.foo WHERE id LIKE "rl%" ORDER BY id;
SELECT id, LAG(other, 2) OVER (ORDER BY other) AS l FROM _dynamodb.foo WHERE id LIKE "rl%" ORDER BY id;
SELECT id, LAG(other, 0) OVER (ORDER BY other) AS l FROM _dynamodb.foo WHERE id LIKE "rl%" ORDER BY id;
SELECT id, LAG(other, 1, -1) OVER (ORDER BY other) AS l FROM _dynamodb.foo WHERE id LIKE "rl%" ORDER BY id;
SELECT id, LAG(other, 2, 0) OVER (ORDER BY other) AS l FROM _dynamodb.foo WHERE id LIKE "rl%" ORDER BY id;
SELECT id, LAG(other, 0, -1) OVER (ORDER BY other) AS l FROM _dynamodb.foo WHERE id LIKE "rl%" ORDER BY id;

-- Test LAG() with PARTITION BY and ORDER BY
SELECT id, LAG(other, 1, -1) OVER (PARTITION BY comment ORDER BY other DESC) AS l FROM _dynamodb.foo WHERE id LIKE "rl%" ORDER BY id;
SELECT id, LAG(other) OVER (PARTITION BY comment ORDER BY other) AS l FROM _dynamodb.foo WHERE id LIKE "rl%" ORDER BY id;
SELECT id, LAG(other, 2) OVER (PARTITION BY comment ORDER BY other) AS l FROM _dynamodb.foo WHERE id LIKE "rl%" ORDER BY id;

-- Test LAG() without ORDER BY (streams, history per partition)
-- Only the count of NULL and default values is checked, since row order is not defined.
SELECT d.comment, COUNT(*) AS n, SUM(d.l IS NULL) AS nulls, SUM(d.l = -1) AS defaults FROM (SELECT comment, LAG(other, 1, -1) OVER (PARTITION BY comment) AS l FROM _dynamodb.foo WHERE id LIKE "rl%") d GROUP BY d.comment ORDER BY d.comment;
SELECT d.comment, COUNT(*) AS n, SUM(d.l IS NULL) AS nulls FROM (SELECT comment, LAG(other) OVER (PARTITION BY comment) AS l FROM _dynamodb.foo WHERE id LIKE "rl%") d GROUP BY d.comment ORDER BY d.comment;
SELECT COUNT(*) AS n, SUM(d.l = 0) AS zeros FROM (SELECT LAG(other, 0, 0) OVER (PARTITION BY comment) AS l FROM _dynamodb.foo WHERE id LIKE "rl%") d;

-- Test LAG() ordering the output by the window result
SELECT id, LAG(other, 1, -1) OVER (ORDER BY other) AS l FROM _dynamodb.foo WHERE id LIKE "rl%" ORDER BY l, id;

-- Test ROW_NUMBER() and LAG() together in one query
SELECT id, ROW_NUMBER() OVER (PARTITION BY comment ORDER BY other) AS rn, LAG(other, 1, 0) OVER (PARTITION BY comment ORDER BY other) AS l FROM _dynamodb.foo WHERE id LIKE "rl%" ORDER BY id;

-- Test ROW_NUMBER() and LAG() combined with an aggregate window
SELECT id, ROW_NUMBER() OVER (ORDER BY other) AS rn, SUM(other) OVER () AS s FROM _dynamodb.foo WHERE id LIKE "rl%" ORDER BY id;

-- Test LAG() over NULL values
INSERT INTO _dynamodb.foo SET id = "rl5", other = null, comment = "x";
SELECT id, LAG(other, 1, -1) OVER (ORDER BY id) AS l FROM _dynamodb.foo WHERE id LIKE "rl%" ORDER BY id;
DELETE FROM _dynamodb.foo WHERE id = "rl5";

-- Cleanup
DELETE FROM _dynamodb.foo WHERE id = "rl1";
DELETE FROM _dynamodb.foo WHERE id = "rl2";
DELETE FROM _dynamodb.foo WHERE id = "rl3";
DELETE FROM _dynamodb.foo WHERE id = "rl4";
