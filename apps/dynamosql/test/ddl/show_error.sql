-- SHOW TABLES with an unknown database must fail with ER_BAD_DB_ERROR
SHOW TABLES FROM no_such_db_for_show;
