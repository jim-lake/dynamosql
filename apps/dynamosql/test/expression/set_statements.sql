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

-- Connection collation with a bare SET
SET collation_connection = 'utf8mb4_bin';
SELECT @@collation_connection AS coll;
SET collation_connection = 'latin1_swedish_ci';
SELECT @@collation_connection AS coll;
SET collation_connection = 'utf8mb4_0900_ai_ci';
SELECT @@collation_connection AS coll;

-- Message locale with a bare SET
SELECT @@lc_messages AS lc;
SET lc_messages = 'ja_JP';
SELECT @@lc_messages AS lc;
SET lc_messages = 'en_US';
SELECT @@lc_messages AS lc;
