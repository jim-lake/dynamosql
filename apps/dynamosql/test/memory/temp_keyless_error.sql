CREATE DATABASE IF NOT EXISTS mem_keyless_err;
USE mem_keyless_err;
CREATE TEMPORARY TABLE kl_err (val INT);
INSERT INTO kl_err (val) VALUES (1), (2);
SELECT DB_ROW_ID FROM kl_err;
SELECT no_such_col FROM kl_err;
SELECT kl_err.DB_ROW_ID FROM kl_err;
CREATE TEMPORARY TABLE kl_named_id (DB_ROW_ID int);
