CREATE DATABASE IF NOT EXISTS dst_distinct;
INSERT INTO _dynamodb.foo SET id = "dis1", other = 10, comment = "alpha";
INSERT INTO _dynamodb.foo SET id = "dis2", other = 10, comment = "alpha";
INSERT INTO _dynamodb.foo SET id = "dis3", other = 20, comment = "beta";
INSERT INTO _dynamodb.foo SET id = "dis4", other = 20, comment = "Beta";
INSERT INTO _dynamodb.foo SET id = "dis5", other = null, comment = "nullish";
INSERT INTO _dynamodb.foo SET id = "dis6", other = null, comment = "nullish";
INSERT INTO _dynamodb.foo SET id = "dis7", other = 30, comment = null;

SELECT DISTINCT other FROM _dynamodb.foo WHERE id LIKE "dis%" ORDER BY other;
SELECT DISTINCT comment FROM _dynamodb.foo WHERE id LIKE "dis%" ORDER BY comment;
SELECT DISTINCT other, comment FROM _dynamodb.foo WHERE id LIKE "dis%" ORDER BY other, comment;
SELECT DISTINCT other, comment FROM _dynamodb.foo WHERE id LIKE "dis%" ORDER BY 1, 2;
SELECT DISTINCT other FROM _dynamodb.foo WHERE id LIKE "dis%" ORDER BY other DESC;
SELECT DISTINCT other FROM _dynamodb.foo WHERE id LIKE "dis%" ORDER BY other LIMIT 2;
SELECT DISTINCT other FROM _dynamodb.foo WHERE id LIKE "dis%" ORDER BY other LIMIT 1, 2;
SELECT DISTINCT other FROM _dynamodb.foo WHERE id LIKE "dis%" ORDER BY other LIMIT 0;
SELECT DISTINCT other FROM _dynamodb.foo WHERE id LIKE "dis%" ORDER BY other LIMIT 10 OFFSET 1;
SELECT DISTINCT other FROM _dynamodb.foo WHERE id = "nope" ORDER BY other;
SELECT DISTINCT other FROM _dynamodb.foo WHERE id = "dis5" ORDER BY other;
SELECT DISTINCT other FROM _dynamodb.foo WHERE id LIKE "dis%" ORDER BY other;
SELECT DISTINCT comment FROM _dynamodb.foo WHERE id LIKE "dis%" ORDER BY comment;
SELECT DISTINCT id FROM _dynamodb.foo WHERE id LIKE "dis%" ORDER BY id;
SELECT DISTINCT other + 1 AS plus FROM _dynamodb.foo WHERE id LIKE "dis%" ORDER BY plus;
SELECT DISTINCT other * 0 AS zeroed FROM _dynamodb.foo WHERE id LIKE "dis%" ORDER BY zeroed;
SELECT DISTINCT LOWER(comment) AS lc FROM _dynamodb.foo WHERE id LIKE "dis%" ORDER BY lc;
SELECT DISTINCT UPPER(comment) AS uc FROM _dynamodb.foo WHERE id LIKE "dis%" ORDER BY uc;
SELECT DISTINCT LENGTH(comment) AS len FROM _dynamodb.foo WHERE id LIKE "dis%" ORDER BY len;
SELECT DISTINCT other > 15 AS big FROM _dynamodb.foo WHERE id LIKE "dis%" ORDER BY big;
SELECT DISTINCT other, 'constant' AS cst FROM _dynamodb.foo WHERE id LIKE "dis%" ORDER BY other;
SELECT DISTINCT comment, other FROM _dynamodb.foo WHERE id LIKE "dis%" ORDER BY comment, other;
SELECT DISTINCT other FROM _dynamodb.foo WHERE id LIKE "dis%" AND other IS NOT NULL ORDER BY other;
SELECT DISTINCT other FROM _dynamodb.foo WHERE id LIKE "dis%" AND other IS NULL ORDER BY other;
SELECT DISTINCT * FROM _dynamodb.foo WHERE id LIKE "dis%" ORDER BY id;
SELECT DISTINCT other, comment FROM _dynamodb.foo WHERE id LIKE "dis%" GROUP BY other, comment ORDER BY other, comment;
SELECT DISTINCT other, COUNT(*) AS cnt FROM _dynamodb.foo WHERE id LIKE "dis%" GROUP BY other ORDER BY other;
SELECT DISTINCT COUNT(*) AS cnt FROM _dynamodb.foo WHERE id LIKE "dis%" GROUP BY other ORDER BY cnt;
SELECT DISTINCT other, SUM(other) AS total FROM _dynamodb.foo WHERE id LIKE "dis%" GROUP BY other HAVING SUM(other) > 10 ORDER BY other;
SELECT DISTINCT other FROM _dynamodb.foo WHERE id LIKE "dis%" GROUP BY other HAVING COUNT(*) > 1 ORDER BY other;
SELECT DISTINCT other, ROW_NUMBER() OVER (ORDER BY id) AS rn FROM _dynamodb.foo WHERE id LIKE "dis%" ORDER BY rn;
SELECT DISTINCT other FROM (SELECT other FROM _dynamodb.foo WHERE id LIKE "dis%") AS sub ORDER BY other;
SELECT DISTINCT sub.other FROM (SELECT other, comment FROM _dynamodb.foo WHERE id LIKE "dis%") AS sub ORDER BY sub.other;
SELECT DISTINCT f.other FROM _dynamodb.foo f JOIN _dynamodb.foo g ON f.other = g.other WHERE f.id LIKE "dis%" AND g.id LIKE "dis%" ORDER BY f.other;
SELECT DISTINCT f.comment FROM _dynamodb.foo f JOIN _dynamodb.foo g ON f.id = g.id WHERE f.id LIKE "dis%" ORDER BY f.comment;
SELECT DISTINCT other FROM _dynamodb.foo WHERE id LIKE "dis%" ORDER BY other + 0;


DROP TEMPORARY TABLE IF EXISTS dst_distinct.dst_ai_ci;
CREATE TEMPORARY TABLE dst_distinct.dst_ai_ci (id INT PRIMARY KEY, s VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci) ENGINE=MEMORY;
INSERT INTO dst_distinct.dst_ai_ci VALUES (1, 'a'), (2, 'A'), (3, 'a '), (4, 'é'), (5, 'e'), (6, 'ß'), (7, 'ss'), (8, NULL), (9, NULL), (10, 'Ä'), (11, 'a'), (12, 'b'), (13, 'B');
SELECT DISTINCT s FROM dst_distinct.dst_ai_ci ORDER BY s;
SELECT DISTINCT s FROM dst_distinct.dst_ai_ci WHERE id <= 5 ORDER BY s;
SELECT DISTINCT s FROM dst_distinct.dst_ai_ci WHERE id > 5 ORDER BY id;
SELECT DISTINCT s, id FROM dst_distinct.dst_ai_ci ORDER BY id;
SELECT DISTINCT s FROM dst_distinct.dst_ai_ci ORDER BY s DESC LIMIT 3;
SELECT DISTINCT s FROM dst_distinct.dst_ai_ci WHERE s = 'a' ORDER BY s;
SELECT DISTINCT LOWER(s) AS ls FROM dst_distinct.dst_ai_ci WHERE id <= 5 ORDER BY ls;


DROP TEMPORARY TABLE IF EXISTS dst_distinct.dst_as_cs;
CREATE TEMPORARY TABLE dst_distinct.dst_as_cs (id INT PRIMARY KEY, s VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_as_cs) ENGINE=MEMORY;
INSERT INTO dst_distinct.dst_as_cs VALUES (1, 'a'), (2, 'A'), (3, 'a'), (4, 'é'), (5, 'e'), (6, 'x');
SELECT DISTINCT s FROM dst_distinct.dst_as_cs ORDER BY s;
SELECT DISTINCT s FROM dst_distinct.dst_as_cs WHERE id <= 2 ORDER BY id;


DROP TEMPORARY TABLE IF EXISTS dst_distinct.dst_num;
CREATE TEMPORARY TABLE dst_distinct.dst_num (id INT PRIMARY KEY, n BIGINT, d DOUBLE, dec_v DECIMAL(10,2)) ENGINE=MEMORY;
INSERT INTO dst_distinct.dst_num VALUES (1, 1, 1.5, 1.50), (2, 1, 1.5, 1.5), (3, 2, 1.5, 2.00), (4, NULL, NULL, NULL), (5, NULL, NULL, NULL), (6, 9223372036854775807, 0, 0.00);
SELECT DISTINCT n FROM dst_distinct.dst_num ORDER BY n;
SELECT DISTINCT d FROM dst_distinct.dst_num ORDER BY d;
SELECT DISTINCT dec_v FROM dst_distinct.dst_num ORDER BY dec_v;
SELECT DISTINCT n, d FROM dst_distinct.dst_num ORDER BY n, d;
SELECT DISTINCT n, d, dec_v FROM dst_distinct.dst_num ORDER BY id;

DROP TEMPORARY TABLE IF EXISTS dst_distinct.dst_dt;
CREATE TEMPORARY TABLE dst_distinct.dst_dt (id INT PRIMARY KEY, d DATE, dt DATETIME, t TIME) ENGINE=MEMORY;
INSERT INTO dst_distinct.dst_dt VALUES (1, '2024-01-01', '2024-01-01 10:00:00', '10:00:00'), (2, '2024-01-01', '2024-01-01 10:00:00', '10:00:00'), (3, '2024-01-02', '2024-01-01 10:00:01', '10:00:01'), (4, NULL, NULL, NULL), (5, NULL, NULL, NULL);
SELECT DISTINCT d FROM dst_distinct.dst_dt ORDER BY d;
SELECT DISTINCT dt FROM dst_distinct.dst_dt ORDER BY dt;
SELECT DISTINCT t FROM dst_distinct.dst_dt ORDER BY t;
SELECT DISTINCT d, t FROM dst_distinct.dst_dt ORDER BY d, t;


SELECT DISTINCT CONCAT(comment, '!') AS c FROM _dynamodb.foo WHERE id LIKE "dis%" ORDER BY c;
SELECT DISTINCT CONCAT_WS('-', comment, other) AS c FROM _dynamodb.foo WHERE id LIKE "dis%" ORDER BY c;
SELECT DISTINCT LEFT(comment, 2) AS c FROM _dynamodb.foo WHERE id LIKE "dis%" ORDER BY c;
SELECT DISTINCT RIGHT(comment, 2) AS c FROM _dynamodb.foo WHERE id LIKE "dis%" ORDER BY c;
SELECT DISTINCT TRIM(CONCAT(' ', comment, ' ')) AS c FROM _dynamodb.foo WHERE id LIKE "dis%" ORDER BY c;
SELECT DISTINCT REVERSE(comment) AS c FROM _dynamodb.foo WHERE id LIKE "dis%" ORDER BY c;
SELECT DISTINCT REPLACE(comment, 'a', 'o') AS c FROM _dynamodb.foo WHERE id LIKE "dis%" ORDER BY c;
SELECT DISTINCT SUBSTRING(comment, 2) AS c FROM _dynamodb.foo WHERE id LIKE "dis%" ORDER BY c;
SELECT DISTINCT LPAD(comment, 6, '*') AS c FROM _dynamodb.foo WHERE id LIKE "dis%" ORDER BY c;
SELECT DISTINCT REPEAT(comment, 2) AS c FROM _dynamodb.foo WHERE id LIKE "dis%" ORDER BY c;
SELECT DISTINCT other, CONCAT(comment, other) AS c FROM _dynamodb.foo WHERE id LIKE "dis%" ORDER BY other, c;
SELECT DISTINCT CONCAT(s, '') AS c FROM dst_distinct.dst_ai_ci WHERE id <= 5 ORDER BY c;
SELECT DISTINCT LEFT(s, 1) AS c FROM dst_distinct.dst_ai_ci WHERE id <= 5 ORDER BY c;
SELECT DISTINCT TRIM(s) AS c FROM dst_distinct.dst_ai_ci ORDER BY c;
SELECT DISTINCT REVERSE(s) AS c FROM dst_distinct.dst_ai_ci WHERE id <= 5 ORDER BY c;
SELECT DISTINCT REPLACE(s, 'a', 'b') AS c FROM dst_distinct.dst_ai_ci WHERE id <= 5 ORDER BY c;
SELECT DISTINCT CONCAT_WS(',', s, 'x') AS c FROM dst_distinct.dst_ai_ci WHERE id <= 5 ORDER BY c;
SELECT DISTINCT REPEAT(s, 2) AS c FROM dst_distinct.dst_ai_ci WHERE id <= 5 ORDER BY c;
SELECT DISTINCT LPAD(s, 3, 'x') AS c FROM dst_distinct.dst_ai_ci WHERE id <= 5 ORDER BY c;
SELECT DISTINCT SUBSTRING(s, 1, 1) AS c FROM dst_distinct.dst_ai_ci WHERE id <= 5 ORDER BY c;

DROP TEMPORARY TABLE IF EXISTS dst_distinct.dst_ai_ci;
DROP TEMPORARY TABLE IF EXISTS dst_distinct.dst_as_cs;
DROP TEMPORARY TABLE IF EXISTS dst_distinct.dst_num;
DROP TEMPORARY TABLE IF EXISTS dst_distinct.dst_dt;

DELETE FROM _dynamodb.foo WHERE id = "dis1";
DELETE FROM _dynamodb.foo WHERE id = "dis2";
DELETE FROM _dynamodb.foo WHERE id = "dis3";
DELETE FROM _dynamodb.foo WHERE id = "dis4";
DELETE FROM _dynamodb.foo WHERE id = "dis5";
DELETE FROM _dynamodb.foo WHERE id = "dis6";
DELETE FROM _dynamodb.foo WHERE id = "dis7";
