-- Setup test data
INSERT IGNORE INTO _dynamodb.foo (id, other, comment) VALUES
  ("grp1", 100, "group a"),
  ("grp2", 100, "group a"),
  ("grp3", 200, "group b"),
  ("grp4", 200, "group b"),
  ("grp5", 300, "group c");
SELECT id, other, comment FROM _dynamodb.foo WHERE id LIKE "grp%" ORDER BY id;

-- GROUP BY with aggregate
SELECT other, SUM(CAST(id AS SIGNED)) AS sum_id FROM _dynamodb.foo WHERE id LIKE "grp%" GROUP BY other ORDER BY other;

-- GROUP BY with multiple aggregates
SELECT other, SUM(CAST(id AS SIGNED)) AS sum_id, COUNT(*) AS cnt FROM _dynamodb.foo WHERE id LIKE "grp%" GROUP BY other ORDER BY other;

-- GROUP BY with HAVING (if supported, otherwise will error)
-- SELECT other, SUM(CAST(id AS SIGNED)) AS sum_id FROM _dynamodb.foo WHERE id LIKE "grp%" GROUP BY other HAVING sum_id > 0 ORDER BY other;

-- GROUP BY string column
SELECT comment, COUNT(*) AS cnt FROM _dynamodb.foo WHERE id LIKE "grp%" GROUP BY comment ORDER BY comment;

-- GROUP BY with expression
SELECT LOWER(comment) AS lc, COUNT(*) AS cnt FROM _dynamodb.foo WHERE id LIKE "grp%" GROUP BY LOWER(comment) ORDER BY lc;

-- GROUP BY with WHERE and ORDER BY
SELECT other, SUM(CAST(id AS SIGNED)) AS sum_id FROM _dynamodb.foo WHERE id LIKE "grp%" AND other >= 100 GROUP BY other ORDER BY sum_id DESC;

-- GROUP BY with NULL values
INSERT IGNORE INTO _dynamodb.foo (id, other, comment) VALUES ("grp6", NULL, "null group");
SELECT other, COUNT(*) AS cnt FROM _dynamodb.foo WHERE id LIKE "grp%" GROUP BY other ORDER BY other;

-- GROUP BY with LIMIT
SELECT other, COUNT(*) AS cnt FROM _dynamodb.foo WHERE id LIKE "grp%" GROUP BY other ORDER BY other LIMIT 2;

-- GROUP BY with OFFSET
SELECT other, COUNT(*) AS cnt FROM _dynamodb.foo WHERE id LIKE "grp%" GROUP BY other ORDER BY other LIMIT 2 OFFSET 1;

-- GROUP BY multiple columns
SELECT other, comment, COUNT(*) AS cnt FROM _dynamodb.foo WHERE id LIKE "grp%" GROUP BY other, comment ORDER BY other, comment;

-- GROUP BY with column position
SELECT other, COUNT(*) AS cnt FROM _dynamodb.foo WHERE id LIKE "grp%" GROUP BY 1 ORDER BY 1;

-- Cleanup
DELETE FROM _dynamodb.foo WHERE id LIKE "grp%";
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
