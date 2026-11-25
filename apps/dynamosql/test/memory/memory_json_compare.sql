-- JSON column values in comparisons, sort, and JSON functions
CREATE DATABASE IF NOT EXISTS mem_json_cmp;
USE mem_json_cmp;

CREATE TEMPORARY TABLE jc (id INT PRIMARY KEY, doc JSON);
INSERT INTO jc (id, doc) VALUES (1, '{"a":1}'), (2, '{"a":"x"}'), (3, '{"a":true}'), (4, '{"a":null}'), (5, '[1,2]'), (6, '"s"'), (7, NULL);

-- Comparison of extracted JSON values with SQL values
SELECT id FROM jc WHERE JSON_EXTRACT(doc, '$.a') = 1 ORDER BY id;
SELECT id FROM jc WHERE JSON_EXTRACT(doc, '$.a') = 'x' ORDER BY id;
SELECT id FROM jc WHERE doc -> '$.a' = 'x' ORDER BY id;
SELECT id FROM jc WHERE doc ->> '$.a' = 'x' ORDER BY id;
SELECT id FROM jc WHERE doc -> '$.a' = true ORDER BY id;
SELECT id FROM jc WHERE doc -> '$.a' = JSON_EXTRACT('{"a":"x"}', '$.a') ORDER BY id;
SELECT id FROM jc WHERE JSON_EXTRACT(doc, '$.a') IS NULL ORDER BY id;
SELECT id, doc -> '$.a' IS NULL AS n FROM jc ORDER BY id;
SELECT id FROM jc WHERE doc = doc ORDER BY id;
SELECT id FROM jc WHERE doc <=> NULL ORDER BY id;

-- JSON boolean comparisons against SQL values and other JSON scalars
CREATE TEMPORARY TABLE jb (id INT PRIMARY KEY, doc JSON);
INSERT INTO jb (id, doc) VALUES (1, '{\"t\":true,\"f\":false,\"n\":1,\"z\":0,\"s\":\"true\"}');
SELECT JSON_EXTRACT(doc, '$.t') = 0 AS r FROM jb;
SELECT JSON_EXTRACT(doc, '$.f') = 0 AS r FROM jb;
SELECT JSON_EXTRACT(doc, '$.f') = FALSE AS r FROM jb;
SELECT JSON_EXTRACT(doc, '$.t') = 'true' AS r FROM jb;
SELECT JSON_EXTRACT(doc, '$.t') = JSON_EXTRACT(doc, '$.n') AS r FROM jb;
SELECT JSON_EXTRACT(doc, '$.n') = TRUE AS r FROM jb;
SELECT JSON_EXTRACT(doc, '$.t') = 2 AS r FROM jb;
SELECT JSON_EXTRACT(doc, '$.f') = 1 AS r FROM jb;
SELECT JSON_EXTRACT(doc, '$.z') = FALSE AS r FROM jb;
SELECT JSON_EXTRACT(doc, '$.t') <> 1 AS r FROM jb;
SELECT JSON_EXTRACT(doc, '$.t') = JSON_EXTRACT(doc, '$.s') AS r FROM jb;
SELECT JSON_EXTRACT(doc, '$.t') = 1 AS r FROM jb;
SELECT JSON_EXTRACT(doc, '$.t') = TRUE AS r FROM jb;
SELECT JSON_EXTRACT(doc, '$.f') IS NULL AS r FROM jb;

-- JSON_VALUE with a RETURNING type
SELECT id, JSON_VALUE(doc, '$.a') AS v FROM jc ORDER BY id;

-- Membership and containment on JSON columns
SELECT id FROM jc WHERE 1 MEMBER OF (doc -> '$') ORDER BY id;
SELECT id FROM jc WHERE 1 MEMBER OF (JSON_EXTRACT(doc, '$')) ORDER BY id;
SELECT id FROM jc WHERE JSON_CONTAINS(doc, '1', '$') ORDER BY id;
SELECT id FROM jc WHERE JSON_CONTAINS(doc, '1') ORDER BY id;

-- Type and conversion of JSON column values
SELECT id, JSON_TYPE(doc) AS t FROM jc ORDER BY id;
SELECT id FROM jc WHERE JSON_TYPE(doc) = 'OBJECT' ORDER BY id;
SELECT id FROM jc WHERE JSON_VALID(doc) ORDER BY id;

-- Cleanup
USE _dynamodb;
DROP DATABASE mem_json_cmp;
