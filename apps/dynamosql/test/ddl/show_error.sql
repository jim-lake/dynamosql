-- SHOW TABLES with an unknown database must fail with ER_BAD_DB_ERROR
SHOW TABLES FROM no_such_db_for_show;
-- SHOW COLUMNS on a missing table must fail with ER_NO_SUCH_TABLE
SHOW COLUMNS FROM _dynamodb.no_such_table_for_show;
-- SHOW INDEX on a missing table must fail with ER_NO_SUCH_TABLE
SHOW INDEX FROM _dynamodb.no_such_table_for_show;
-- SHOW CREATE TABLE on a missing table must fail with ER_NO_SUCH_TABLE
SHOW CREATE TABLE _dynamodb.no_such_table_for_show;
