-- Derived tables whose inner query exercises early stop, multi-batch output, and DynamoDB windows
CREATE DATABASE IF NOT EXISTS der_stream;
DROP TABLE IF EXISTS der_stream.big;
DROP TABLE IF EXISTS der_stream.digits;
CREATE TABLE der_stream.digits (d INT PRIMARY KEY) ENGINE=MEMORY;
INSERT INTO der_stream.digits (d) VALUES (0), (1), (2), (3), (4), (5), (6), (7), (8), (9);
CREATE TABLE der_stream.big (id INT PRIMARY KEY, grp INT NOT NULL, val INT NOT NULL) ENGINE=MEMORY;
INSERT INTO der_stream.big (id, grp, val)
  SELECT a.d * 1000 + b.d * 100 + c.d * 10 + e.d, (a.d + b.d + c.d + e.d) % 7, (a.d * 13 + b.d * 7 + c.d * 3 + e.d) % 101
  FROM der_stream.digits a
  JOIN der_stream.digits b
  JOIN der_stream.digits c
  JOIN der_stream.digits e
  WHERE a.d < 3;

SELECT COUNT(*) AS n FROM (SELECT id FROM der_stream.big) s;
SELECT COUNT(*) AS n, MIN(s.id) AS mn, MAX(s.id) AS mx FROM (SELECT id FROM der_stream.big WHERE id < 2500) s;
SELECT s.id FROM (SELECT id FROM der_stream.big) s ORDER BY s.id LIMIT 3;
SELECT COUNT(*) AS n FROM (SELECT id FROM der_stream.big ORDER BY id LIMIT 5) s;
SELECT s.id FROM (SELECT id FROM der_stream.big ORDER BY id DESC LIMIT 1500) s ORDER BY s.id LIMIT 2;
SELECT s.id FROM (SELECT id FROM der_stream.big ORDER BY id DESC LIMIT 1500) s ORDER BY s.id LIMIT 2 OFFSET 1000;
SELECT s.id FROM (SELECT id FROM der_stream.big WHERE id > 100000) s ORDER BY s.id LIMIT 1;
SELECT COUNT(*) AS n FROM (SELECT id FROM der_stream.big WHERE id < 1500) s WHERE s.id > 1000;

SELECT s.grp, COUNT(*) AS n, SUM(s.val) AS total FROM (SELECT grp, val FROM der_stream.big) s GROUP BY s.grp ORDER BY s.grp;
SELECT s.grp, COUNT(*) AS n FROM (SELECT grp FROM der_stream.big GROUP BY grp HAVING COUNT(*) > 0) s GROUP BY s.grp ORDER BY s.grp;
SELECT s.grp, s.n FROM (SELECT grp, COUNT(*) AS n FROM der_stream.big GROUP BY grp) s WHERE s.n > 350 ORDER BY s.grp;
SELECT s.id, s.val FROM (SELECT id, val FROM der_stream.big WHERE val > 90) s ORDER BY s.val DESC, s.id LIMIT 4;

SELECT a.id, b.id AS bid FROM (SELECT id FROM der_stream.big WHERE id < 3) a JOIN (SELECT id FROM der_stream.big WHERE id < 3) b ON b.id = a.id ORDER BY a.id;
SELECT a.id FROM (SELECT id FROM der_stream.big WHERE id < 1200) a LEFT JOIN (SELECT id FROM der_stream.big WHERE id < 1100) b ON b.id = a.id WHERE b.id IS NULL ORDER BY a.id LIMIT 3;
SELECT s.id FROM (SELECT id FROM der_stream.big WHERE id < 1500) s JOIN der_stream.digits d ON d.d = s.id WHERE s.id < 10 ORDER BY s.id;

DELETE FROM _dynamodb.foo WHERE id LIKE "ds%";
INSERT INTO _dynamodb.foo SET id = "ds1", other = 10, comment = "p";
INSERT INTO _dynamodb.foo SET id = "ds2", other = 20, comment = "p";
INSERT INTO _dynamodb.foo SET id = "ds3", other = 30, comment = "q";
INSERT INTO _dynamodb.foo SET id = "ds4", other = 40, comment = "q";
INSERT INTO _dynamodb.foo SET id = "ds5", other = 50, comment = "q";

SELECT s.id, s.other FROM (SELECT id, other FROM _dynamodb.foo WHERE id LIKE "ds%") s ORDER BY s.id LIMIT 2;
SELECT s.id, s.other FROM (SELECT id, other FROM _dynamodb.foo WHERE id LIKE "ds%") s ORDER BY s.other DESC LIMIT 1;
SELECT COUNT(*) AS n, SUM(s.other) AS total FROM (SELECT other FROM _dynamodb.foo WHERE id LIKE "ds%") s;
SELECT s.comment, COUNT(*) AS n FROM (SELECT comment FROM _dynamodb.foo WHERE id LIKE "ds%") s GROUP BY s.comment ORDER BY s.comment;
SELECT d.id, d.nxt FROM (SELECT id, LEAD(other) OVER (ORDER BY other) AS nxt FROM _dynamodb.foo WHERE id LIKE "ds%") d ORDER BY d.id;
SELECT d.id, d.rn FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn FROM _dynamodb.foo WHERE id LIKE "ds%") d WHERE d.rn > 3 ORDER BY d.rn;

DELETE FROM _dynamodb.foo WHERE id LIKE "ds%";
