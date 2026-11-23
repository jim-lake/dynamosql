-- ABS with every input type, checking value and column type against MySQL

-- Integer literals
SELECT ABS(0) AS result;
SELECT ABS(5) AS result;
SELECT ABS(-5) AS result;
SELECT ABS(9223372036854775807) AS result;

-- Decimal and floating literals
SELECT ABS(0.0) AS result;
SELECT ABS(-0.0) AS result;
SELECT ABS(3.14) AS result;
SELECT ABS(-3.14) AS result;
SELECT ABS(0.001) AS result;
SELECT ABS(-0.001) AS result;
SELECT ABS(-1.5e3) AS result;
SELECT ABS(1e-300) AS result;
SELECT ABS(-1e-300) AS result;

-- Typed values through CAST
SELECT ABS(CAST(-7 AS SIGNED)) AS result;
SELECT ABS(CAST(7 AS SIGNED)) AS result;
SELECT ABS(CAST(-3.25 AS DECIMAL(10,2))) AS result;
SELECT ABS(CAST(3.25 AS DECIMAL(10,2))) AS result;
SELECT ABS(CAST(-1.5 AS DOUBLE)) AS result;

-- String values
SELECT ABS("5") AS result;
SELECT ABS("-5") AS result;
SELECT ABS("-5.5") AS result;
SELECT ABS("5.5x") AS result;
SELECT ABS("-5.5x") AS result;
SELECT ABS(" -5") AS result;
SELECT ABS("abc") AS result;
SELECT ABS("") AS result;
SELECT ABS("0") AS result;

-- Booleans
SELECT ABS(TRUE) AS result;
SELECT ABS(FALSE) AS result;

-- NULL
SELECT ABS(NULL) AS result;

-- Hexadecimal literals
SELECT ABS(0xFF) AS result;

-- Temporal values
SELECT ABS(DATE("2020-01-02")) AS result;
SELECT ABS(CAST("2020-01-02 10:00:00" AS DATETIME)) AS result;
SELECT ABS(CAST("10:20:30" AS TIME)) AS result;
SELECT ABS(CAST("-10:20:30" AS TIME)) AS result;

-- Column values
CREATE DATABASE IF NOT EXISTS fn_abs;
DROP TABLE IF EXISTS fn_abs.t;
CREATE TABLE fn_abs.t (
  id INT NOT NULL PRIMARY KEY,
  i INT,
  bi BIGINT,
  ui BIGINT UNSIGNED,
  d DOUBLE,
  dec_v DECIMAL(10, 2),
  f FLOAT,
  s VARCHAR(20),
  y YEAR,
  b TINYINT(1)
) ENGINE=MEMORY;
INSERT INTO fn_abs.t VALUES (1, -5, -9223372036854775807, 9223372036854775807, -2.5, -3.25, -1.5, '-4.5', 2020, 1);
INSERT INTO fn_abs.t VALUES (2, 7, 9223372036854775807, 0, 2.5, 3.25, 1.5, '4.5', 1901, 0);
SELECT id, ABS(i) AS r FROM fn_abs.t ORDER BY id;
SELECT id, ABS(bi) AS r FROM fn_abs.t ORDER BY id;
SELECT id, ABS(ui) AS r FROM fn_abs.t ORDER BY id;
SELECT id, ABS(d) AS r FROM fn_abs.t ORDER BY id;
SELECT id, ABS(dec_v) AS r FROM fn_abs.t ORDER BY id;
SELECT id, ABS(f) AS r FROM fn_abs.t ORDER BY id;
SELECT id, ABS(s) AS r FROM fn_abs.t ORDER BY id;
SELECT id, ABS(y) AS r FROM fn_abs.t ORDER BY id;
SELECT id, ABS(b) AS r FROM fn_abs.t ORDER BY id;
SELECT id, ABS(i) + ABS(d) AS r FROM fn_abs.t ORDER BY id;
SELECT id FROM fn_abs.t WHERE ABS(i) > 4 ORDER BY id;
SELECT ABS(i) AS r, COUNT(*) AS c FROM fn_abs.t GROUP BY ABS(i) ORDER BY r;
DROP TABLE fn_abs.t;

-- Nesting
SELECT ABS(ABS(-5)) AS result;
SELECT ABS(-ABS(-5.5)) AS result;
SELECT ABS(ROUND(-2.567, 1)) AS result;
SELECT ABS(-5) + 1 AS result;
SELECT ABS(-5) * -1 AS result;
SELECT CAST(ABS(-5) AS CHAR) AS result;
SELECT CONCAT(ABS(-5), 'x') AS result;
SELECT CASE WHEN ABS(-1) = 1 THEN ABS(-3) ELSE 0.5 END AS result;
SELECT IF(ABS(-2) > 1, ABS(-2.5), 0) AS result;
SELECT IFNULL(ABS(NULL), -1) AS result;
SELECT COALESCE(ABS(NULL), 7) AS result;
SELECT ABS(GREATEST(-3, -7)) AS result;
SELECT ABS(LEAST(-3, -7)) AS result;
