CREATE DATABASE IF NOT EXISTS mem_pad_coll_db;
USE mem_pad_coll_db;
SELECT 'abc' COLLATE utf8mb4_bin = 'abc ' AS pad_space;
SELECT 'abc' COLLATE utf8mb4_0900_bin = 'abc ' AS no_pad;
SELECT 'abc' = 'abc ' AS default_collation;
USE _dynamodb;
DROP DATABASE mem_pad_coll_db;
