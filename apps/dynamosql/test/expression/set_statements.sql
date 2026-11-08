-- User variable assignment with :=
SET @var := 5;
SELECT @var AS v;
SET @s := CONCAT('a', 'b');
SELECT @s AS s;
SET @a = 1, @b := 2;
SELECT @a AS a, @b AS b;

-- Session time zone with and without a scope keyword
SET SESSION time_zone = '+03:00';
SELECT @@session.time_zone AS tz;
SET LOCAL time_zone = '+05:00';
SELECT @@session.time_zone AS tz;
SET time_zone = '+00:00';
SELECT @@session.time_zone AS tz;
SET @@time_zone = '+00:00';
SELECT @@time_zone AS tz;
