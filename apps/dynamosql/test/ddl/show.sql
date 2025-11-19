-- Cleanup any leftover tables from failed tests
USE _dynamodb;
DROP TABLE IF EXISTS alter_error_test;
DROP TABLE IF EXISTS alter_error_test2;
DROP TABLE IF EXISTS test_unknown_engine;
DROP TABLE IF EXISTS test_memory_in_dynamodb;
DROP TABLE IF EXISTS test_dup_pk;

-- Test SHOW TABLES with database context
SHOW TABLES;
