-- JSON_ARRAYAGG and JSON_OBJECTAGG tests
CREATE TEMPORARY TABLE json_agg_t (grp VARCHAR(10), k VARCHAR(10), v INT, j JSON);
INSERT INTO json_agg_t VALUES ('a', 'x', 1, '{"n": 1}'), ('a', 'y', NULL, NULL), ('b', 'x', 3, '[1, 2]'), ('b', 'z', 4, '"str"');

-- JSON_ARRAYAGG tests
SELECT JSON_ARRAYAGG(v) AS json_value FROM json_agg_t;
SELECT JSON_ARRAYAGG(k) AS json_value FROM json_agg_t;
SELECT JSON_ARRAYAGG(v) AS json_value FROM json_agg_t WHERE grp = 'a';
SELECT JSON_ARRAYAGG(v) AS json_value FROM json_agg_t WHERE v IS NULL;
SELECT JSON_ARRAYAGG(v) AS json_value FROM json_agg_t WHERE 1 = 0;
SELECT JSON_ARRAYAGG(j) AS json_value FROM json_agg_t;
SELECT JSON_ARRAYAGG(v + 1.5) AS json_value FROM json_agg_t;
SELECT JSON_ARRAYAGG(k IS NULL) AS json_value FROM json_agg_t;
SELECT JSON_ARRAYAGG(JSON_ARRAY(v)) AS json_value FROM json_agg_t;
SELECT JSON_ARRAYAGG(CAST('2020-01-02' AS DATE)) AS json_value FROM json_agg_t;
SELECT JSON_ARRAYAGG(1) AS json_value FROM json_agg_t;
SELECT JSON_ARRAYAGG('x') AS json_value FROM json_agg_t WHERE 1 = 0;
SELECT JSON_ARRAYAGG(5) AS json_value;
SELECT JSON_ARRAYAGG(v) AS json_value, COUNT(*) AS cnt FROM json_agg_t WHERE 1 = 0;
SELECT grp, JSON_ARRAYAGG(v) AS json_value FROM json_agg_t GROUP BY grp ORDER BY grp;
SELECT JSON_LENGTH(JSON_ARRAYAGG(v)) AS json_value FROM json_agg_t;

-- JSON_OBJECTAGG tests
SELECT JSON_OBJECTAGG(k, v) AS json_value FROM json_agg_t;
SELECT JSON_OBJECTAGG(k, v) AS json_value FROM json_agg_t WHERE grp = 'a';
SELECT JSON_OBJECTAGG(k, j) AS json_value FROM json_agg_t WHERE grp = 'a';
SELECT JSON_OBJECTAGG(k, NULL) AS json_value FROM json_agg_t WHERE grp = 'a';
SELECT JSON_OBJECTAGG(v, k) AS json_value FROM json_agg_t WHERE v IS NOT NULL;
SELECT JSON_OBJECTAGG(k, v) AS json_value FROM json_agg_t WHERE 1 = 0;
SELECT JSON_OBJECTAGG('a', 1) AS json_value;
SELECT JSON_OBJECTAGG(k, v + 0.5) AS json_value FROM json_agg_t WHERE grp = 'b';
SELECT grp, JSON_OBJECTAGG(k, v) AS json_value FROM json_agg_t GROUP BY grp ORDER BY grp;
SELECT JSON_EXTRACT(JSON_OBJECTAGG(k, v), '$.z') AS json_value FROM json_agg_t;

-- JSON_OBJECTAGG with a NULL key
CREATE TEMPORARY TABLE json_agg_null_key (k VARCHAR(10), v INT);
INSERT INTO json_agg_null_key VALUES ('a', 1), (NULL, 2);
SELECT JSON_OBJECTAGG(k, v) AS json_value FROM json_agg_null_key;
SELECT JSON_OBJECTAGG(k, v) AS json_value FROM json_agg_null_key WHERE k = 'a';

DROP TABLE json_agg_t;
DROP TABLE json_agg_null_key;
