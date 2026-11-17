-- Test SELECT with a star mixed with expressions
CREATE DATABASE IF NOT EXISTS select_star_mixed;
CREATE TEMPORARY TABLE select_star_mixed.t (id INT PRIMARY KEY, a INT, b VARCHAR(10));
CREATE TEMPORARY TABLE select_star_mixed.u (id INT PRIMARY KEY, x INT);
INSERT INTO select_star_mixed.t (id, a, b) VALUES (1, 10, 'x'), (2, 20, 'y');
INSERT INTO select_star_mixed.u (id, x) VALUES (1, 100), (2, 200);

-- Star followed by an expression
SELECT *, a + 1 AS c FROM select_star_mixed.t ORDER BY id;
SELECT *, a * 2 AS d, a + 1 AS c FROM select_star_mixed.t ORDER BY id;

-- Qualified star followed by an expression, and expression before qualified star
SELECT t.*, a + 1 AS c FROM select_star_mixed.t t ORDER BY id;
SELECT a + 1 AS c, t.* FROM select_star_mixed.t t ORDER BY id;

-- Star with an expression referencing a joined table
SELECT *, t.a + 1 AS c FROM select_star_mixed.t t JOIN select_star_mixed.u u ON t.id = u.id ORDER BY t.id;
SELECT *, u.x + 1 AS c FROM select_star_mixed.t t JOIN select_star_mixed.u u ON t.id = u.id ORDER BY t.id;

-- Star with an aggregate
SELECT *, COUNT(*) AS n FROM select_star_mixed.t GROUP BY id, a, b ORDER BY id;
