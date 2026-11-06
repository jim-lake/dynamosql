SELECT * FROM _dynamodb.foo JOIN _dynamodb.bar USING (id) ORDER BY foo.id ASC;
SELECT foo.*, bar.* FROM _dynamodb.foo JOIN _dynamodb.bar USING (id) ORDER BY foo.id ASC;
SELECT foo.* FROM _dynamodb.foo JOIN _dynamodb.bar USING (id) ORDER BY foo.id ASC;
SELECT bar.* FROM _dynamodb.foo JOIN _dynamodb.bar USING (id) ORDER BY foo.id ASC;
SELECT * FROM _dynamodb.foo INNER JOIN _dynamodb.bar USING (id) ORDER BY foo.id ASC;
SELECT * FROM _dynamodb.foo LEFT JOIN _dynamodb.bar USING (id) ORDER BY foo.id ASC;
SELECT foo.*, bar.* FROM _dynamodb.foo LEFT JOIN _dynamodb.bar USING (id) ORDER BY foo.id ASC;
SELECT foo.* FROM _dynamodb.foo LEFT JOIN _dynamodb.bar USING (id) ORDER BY foo.id ASC;
SELECT bar.* FROM _dynamodb.foo LEFT JOIN _dynamodb.bar USING (id) ORDER BY foo.id ASC;
SELECT * FROM _dynamodb.foo LEFT OUTER JOIN _dynamodb.bar USING (id) ORDER BY foo.id ASC;
SELECT * FROM _dynamodb.foo NATURAL JOIN _dynamodb.bar ORDER BY foo.id ASC;
SELECT * FROM _dynamodb.foo NATURAL LEFT JOIN _dynamodb.bar ORDER BY foo.id ASC;

SELECT foo.id, foo.other, bar.other FROM _dynamodb.foo
  JOIN _dynamodb.bar USING (id)
  WHERE foo.other > 100
  ORDER BY foo.id;
SELECT foo.id, foo.other, bar.other FROM _dynamodb.foo
  LEFT JOIN _dynamodb.bar USING (id)
  WHERE bar.other > 100
  ORDER BY foo.id;
SELECT foo.id, foo.other, bar.other FROM _dynamodb.foo
  LEFT JOIN _dynamodb.bar USING (id)
  WHERE foo.other IS NULL
  ORDER BY foo.id;
SELECT foo.id, foo.other, bar.other FROM _dynamodb.foo
  JOIN _dynamodb.bar USING (id)
  ORDER BY foo.other DESC, bar.other ASC;
SELECT foo.id, foo.other, bar.other FROM _dynamodb.foo
  JOIN _dynamodb.bar USING (id)
  ORDER BY foo.id
  LIMIT 2;
SELECT foo.id, foo.other, bar.other FROM _dynamodb.foo
  LEFT JOIN _dynamodb.bar USING (id)
  ORDER BY foo.id
  LIMIT 3;

SELECT f.id AS foo_id, f.other AS foo_other, b.id AS bar_id, b.other AS bar_other
  FROM _dynamodb.foo f
  JOIN _dynamodb.bar b USING (id)
  ORDER BY f.id;
SELECT f.id AS foo_id, f.other AS foo_other, b.id AS bar_id, b.other AS bar_other
  FROM _dynamodb.foo f
  LEFT JOIN _dynamodb.bar b USING (id)
  ORDER BY f.id;
SELECT foo.id, SUM(bar.otherother) AS total
  FROM _dynamodb.foo
  JOIN _dynamodb.bar USING (id)
  GROUP BY foo.id
  ORDER BY foo.id;
SELECT foo.id, COUNT(bar.id) AS n
  FROM _dynamodb.foo
  LEFT JOIN _dynamodb.bar USING (id)
  GROUP BY foo.id
  ORDER BY foo.id;
SELECT id, foo.other, bar.other FROM _dynamodb.foo JOIN _dynamodb.bar USING (id) ORDER BY id;
SELECT id, foo.comment, bar.otherother FROM _dynamodb.foo LEFT JOIN _dynamodb.bar USING (id) ORDER BY id;

SELECT * FROM _dynamodb.foo JOIN _dynamodb.other USING (other) ORDER BY foo.id ASC;
SELECT * FROM _dynamodb.foo LEFT JOIN _dynamodb.other USING (other) ORDER BY foo.id ASC;
SELECT foo.id, other.otherother FROM _dynamodb.foo JOIN _dynamodb.other USING (other) ORDER BY foo.id ASC;
SELECT bar.id, otherother.comment FROM _dynamodb.bar JOIN _dynamodb.otherother USING (otherother) ORDER BY bar.id ASC;

SELECT foo.id, bar.id, otherother.comment FROM _dynamodb.foo
  JOIN _dynamodb.bar USING (id)
  JOIN _dynamodb.otherother USING (otherother)
  ORDER BY foo.id;
SELECT foo.id, bar.id, otherother.comment FROM _dynamodb.foo
  LEFT JOIN _dynamodb.bar USING (id)
  LEFT JOIN _dynamodb.otherother USING (otherother)
  ORDER BY foo.id;
SELECT foo.id, bar.id, other.comment FROM _dynamodb.foo
  JOIN _dynamodb.bar USING (id)
  JOIN _dynamodb.other USING (comment)
  ORDER BY foo.id;

SELECT s1.id AS s1id, s2.other AS s2other, s1.other AS s1other
  FROM _dynamodb.bar s1
  JOIN _dynamodb.bar s2 USING (id)
  ORDER BY s1id ASC;
SELECT s1.id AS s1id, s2.id AS s2id, s1.other AS s1other, s2.other AS s2other
  FROM _dynamodb.bar s1
  LEFT JOIN _dynamodb.bar s2 USING (id)
  ORDER BY s1id ASC;
SELECT s1.id AS s1id, s2.id AS s2id
  FROM _dynamodb.bar s1
  JOIN _dynamodb.bar s2 USING (id, other)
  ORDER BY s1id ASC;

SELECT * FROM _dynamodb.foo JOIN _dynamodb.empty USING (id) ORDER BY foo.id ASC;
SELECT * FROM _dynamodb.foo LEFT JOIN _dynamodb.empty USING (id) ORDER BY foo.id ASC;
SELECT foo.id, bar.id FROM _dynamodb.foo JOIN _dynamodb.bar USING (id, other) ORDER BY foo.id ASC;

CREATE DATABASE IF NOT EXISTS mem_join_using;
USE mem_join_using;
CREATE TEMPORARY TABLE t1 (id INT PRIMARY KEY, k INT, v VARCHAR(16));
CREATE TEMPORARY TABLE t2 (rid INT PRIMARY KEY, k INT, w VARCHAR(16));
INSERT INTO t1 (id, k, v) VALUES (1, 1, 'a'), (2, NULL, 'b'), (3, 1, 'c'), (4, 5, 'd');
INSERT INTO t2 (rid, k, w) VALUES (10, 1, 'x'), (11, NULL, 'y'), (12, 1, 'z'), (13, 7, 'q');
SELECT * FROM t1 JOIN t2 USING (k) ORDER BY t1.id, t2.rid;
SELECT * FROM t1 LEFT JOIN t2 USING (k) ORDER BY t1.id, t2.rid;
SELECT t1.id, t2.rid FROM t1 NATURAL JOIN t2 ORDER BY t1.id, t2.rid;
SELECT t1.id, t2.rid, k FROM t1 JOIN t2 USING (k) WHERE k IS NULL ORDER BY t1.id;
SELECT t1.id, t2.rid FROM t1 LEFT JOIN t2 USING (k) WHERE t2.rid IS NULL ORDER BY t1.id;
CREATE TEMPORARY TABLE t3 (id INT, k INT, PRIMARY KEY (id, k));
INSERT INTO t3 (id, k) VALUES (1, 1), (1, 2), (2, 2);
SELECT t1.id AS t1id, t3.id AS t3id, k FROM t1 JOIN t3 USING (id, k) ORDER BY t1.id, t3.k;
SELECT t1.id AS t1id, t3.id AS t3id, k FROM t1 LEFT JOIN t3 USING (id, k) ORDER BY t1.id, t3.k;
CREATE TEMPORARY TABLE t4 (k VARCHAR(16) PRIMARY KEY, n INT);
INSERT INTO t4 (k, n) VALUES ('1', 100), ('01', 200), ('abc', 300);
SELECT t1.id, t4.n FROM t1 JOIN t4 USING (k) ORDER BY t1.id;
CREATE TEMPORARY TABLE u1 (id INT PRIMARY KEY, c INT);
CREATE TEMPORARY TABLE u2 (id INT PRIMARY KEY, z INT);
CREATE TEMPORARY TABLE u3 (c INT PRIMARY KEY, q VARCHAR(16));
INSERT INTO u1 (id, c) VALUES (1, 100), (2, 200);
INSERT INTO u2 (id, z) VALUES (1, 5), (2, 6);
INSERT INTO u3 (c, q) VALUES (100, 'hit'), (300, 'miss');
SELECT u1.id, u3.q FROM u1 JOIN u2 USING (id) JOIN u3 USING (c) ORDER BY u1.id;
SELECT u1.id, u3.q FROM u1 LEFT JOIN u2 USING (id) LEFT JOIN u3 USING (c) ORDER BY u1.id;
