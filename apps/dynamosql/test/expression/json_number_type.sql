CREATE DATABASE IF NOT EXISTS jnt_db;
CREATE TEMPORARY TABLE jnt_db.jnt (id INT PRIMARY KEY, doc JSON);
INSERT INTO jnt_db.jnt VALUES (1, '1000');
SELECT id, CAST(doc AS CHAR) AS doc_text FROM jnt_db.jnt;
SELECT CAST('{"a":1}' AS CHAR) AS doc_text;
SELECT CAST('abc' AS CHAR) AS doc_text;
SELECT CAST('abc' AS CHAR(10)) AS doc_text;
SELECT CAST(CAST('abc' AS CHAR(10)) AS CHAR) AS doc_text;
DROP TEMPORARY TABLE jnt_db.jnt;
