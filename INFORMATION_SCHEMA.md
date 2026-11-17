# INFORMATION_SCHEMA support

Tables and columns from MySQL 8.4 (`8.4.11`), read from the live server's `information_schema.COLUMNS`. ✅ means DynamoSQL implements the table or column. ❌ means it does not.

Only `SCHEMATA`, `TABLES`, and `COLUMNS` are implemented among the 78 MySQL 8.4 tables. Their implemented columns come from `src/lib/engine/information_schema/schema.ts`. `CATALOGS` is implemented by DynamoSQL, but MySQL 8.4 has no such table, so it is listed separately below.

## Tables

| Table                                 | Supported | Columns in 8.4 | Columns supported |
| ------------------------------------- | --------- | -------------- | ----------------- |
| ADMINISTRABLE_ROLE_AUTHORIZATIONS     | ❌        | 9              | 0                 |
| APPLICABLE_ROLES                      | ❌        | 9              | 0                 |
| CHARACTER_SETS                        | ❌        | 4              | 0                 |
| CHECK_CONSTRAINTS                     | ❌        | 4              | 0                 |
| COLLATIONS                            | ❌        | 7              | 0                 |
| COLLATION_CHARACTER_SET_APPLICABILITY | ❌        | 2              | 0                 |
| COLUMNS                               | ✅        | 22             | 22                |
| COLUMNS_EXTENSIONS                    | ❌        | 6              | 0                 |
| COLUMN_PRIVILEGES                     | ❌        | 7              | 0                 |
| COLUMN_STATISTICS                     | ❌        | 4              | 0                 |
| ENABLED_ROLES                         | ❌        | 4              | 0                 |
| ENGINES                               | ❌        | 6              | 0                 |
| EVENTS                                | ❌        | 24             | 0                 |
| FILES                                 | ❌        | 38             | 0                 |
| INNODB_BUFFER_PAGE                    | ❌        | 21             | 0                 |
| INNODB_BUFFER_PAGE_LRU                | ❌        | 20             | 0                 |
| INNODB_BUFFER_POOL_STATS              | ❌        | 32             | 0                 |
| INNODB_CACHED_INDEXES                 | ❌        | 3              | 0                 |
| INNODB_CMP                            | ❌        | 6              | 0                 |
| INNODB_CMPMEM                         | ❌        | 6              | 0                 |
| INNODB_CMPMEM_RESET                   | ❌        | 6              | 0                 |
| INNODB_CMP_PER_INDEX                  | ❌        | 8              | 0                 |
| INNODB_CMP_PER_INDEX_RESET            | ❌        | 8              | 0                 |
| INNODB_CMP_RESET                      | ❌        | 6              | 0                 |
| INNODB_COLUMNS                        | ❌        | 8              | 0                 |
| INNODB_DATAFILES                      | ❌        | 2              | 0                 |
| INNODB_FIELDS                         | ❌        | 3              | 0                 |
| INNODB_FOREIGN                        | ❌        | 5              | 0                 |
| INNODB_FOREIGN_COLS                   | ❌        | 4              | 0                 |
| INNODB_FT_BEING_DELETED               | ❌        | 1              | 0                 |
| INNODB_FT_CONFIG                      | ❌        | 2              | 0                 |
| INNODB_FT_DEFAULT_STOPWORD            | ❌        | 1              | 0                 |
| INNODB_FT_DELETED                     | ❌        | 1              | 0                 |
| INNODB_FT_INDEX_CACHE                 | ❌        | 6              | 0                 |
| INNODB_FT_INDEX_TABLE                 | ❌        | 6              | 0                 |
| INNODB_INDEXES                        | ❌        | 8              | 0                 |
| INNODB_METRICS                        | ❌        | 17             | 0                 |
| INNODB_SESSION_TEMP_TABLESPACES       | ❌        | 6              | 0                 |
| INNODB_TABLES                         | ❌        | 10             | 0                 |
| INNODB_TABLESPACES                    | ❌        | 15             | 0                 |
| INNODB_TABLESPACES_BRIEF              | ❌        | 5              | 0                 |
| INNODB_TABLESTATS                     | ❌        | 9              | 0                 |
| INNODB_TEMP_TABLE_INFO                | ❌        | 4              | 0                 |
| INNODB_TRX                            | ❌        | 25             | 0                 |
| INNODB_VIRTUAL                        | ❌        | 3              | 0                 |
| KEYWORDS                              | ❌        | 2              | 0                 |
| KEY_COLUMN_USAGE                      | ❌        | 12             | 0                 |
| OPTIMIZER_TRACE                       | ❌        | 4              | 0                 |
| PARAMETERS                            | ❌        | 16             | 0                 |
| PARTITIONS                            | ❌        | 25             | 0                 |
| PLUGINS                               | ❌        | 11             | 0                 |
| PROCESSLIST                           | ❌        | 8              | 0                 |
| PROFILING                             | ❌        | 18             | 0                 |
| REFERENTIAL_CONSTRAINTS               | ❌        | 11             | 0                 |
| RESOURCE_GROUPS                       | ❌        | 5              | 0                 |
| ROLE_COLUMN_GRANTS                    | ❌        | 10             | 0                 |
| ROLE_ROUTINE_GRANTS                   | ❌        | 12             | 0                 |
| ROLE_TABLE_GRANTS                     | ❌        | 9              | 0                 |
| ROUTINES                              | ❌        | 31             | 0                 |
| SCHEMATA                              | ✅        | 6              | 6                 |
| SCHEMATA_EXTENSIONS                   | ❌        | 3              | 0                 |
| SCHEMA_PRIVILEGES                     | ❌        | 5              | 0                 |
| STATISTICS                            | ❌        | 18             | 0                 |
| ST_GEOMETRY_COLUMNS                   | ❌        | 7              | 0                 |
| ST_SPATIAL_REFERENCE_SYSTEMS          | ❌        | 6              | 0                 |
| ST_UNITS_OF_MEASURE                   | ❌        | 4              | 0                 |
| TABLES                                | ✅        | 21             | 20                |
| TABLESPACES_EXTENSIONS                | ❌        | 2              | 0                 |
| TABLES_EXTENSIONS                     | ❌        | 5              | 0                 |
| TABLE_CONSTRAINTS                     | ❌        | 7              | 0                 |
| TABLE_CONSTRAINTS_EXTENSIONS          | ❌        | 6              | 0                 |
| TABLE_PRIVILEGES                      | ❌        | 6              | 0                 |
| TRIGGERS                              | ❌        | 22             | 0                 |
| USER_ATTRIBUTES                       | ❌        | 3              | 0                 |
| USER_PRIVILEGES                       | ❌        | 4              | 0                 |
| VIEWS                                 | ❌        | 10             | 0                 |
| VIEW_ROUTINE_USAGE                    | ❌        | 6              | 0                 |
| VIEW_TABLE_USAGE                      | ❌        | 6              | 0                 |

## CATALOGS (not in MySQL 8.4)

| Table    | Supported | Notes                                              |
| -------- | --------- | -------------------------------------------------- |
| CATALOGS | ✅        | DynamoSQL only. MySQL 8.4 has no `CATALOGS` table. |

## Columns

### ADMINISTRABLE_ROLE_AUTHORIZATIONS ❌

| Column       | Supported |
| ------------ | --------- |
| USER         | ❌        |
| HOST         | ❌        |
| GRANTEE      | ❌        |
| GRANTEE_HOST | ❌        |
| ROLE_NAME    | ❌        |
| ROLE_HOST    | ❌        |
| IS_GRANTABLE | ❌        |
| IS_DEFAULT   | ❌        |
| IS_MANDATORY | ❌        |

### APPLICABLE_ROLES ❌

| Column       | Supported |
| ------------ | --------- |
| USER         | ❌        |
| HOST         | ❌        |
| GRANTEE      | ❌        |
| GRANTEE_HOST | ❌        |
| ROLE_NAME    | ❌        |
| ROLE_HOST    | ❌        |
| IS_GRANTABLE | ❌        |
| IS_DEFAULT   | ❌        |
| IS_MANDATORY | ❌        |

### CHARACTER_SETS ❌

| Column               | Supported |
| -------------------- | --------- |
| CHARACTER_SET_NAME   | ❌        |
| DEFAULT_COLLATE_NAME | ❌        |
| DESCRIPTION          | ❌        |
| MAXLEN               | ❌        |

### CHECK_CONSTRAINTS ❌

| Column             | Supported |
| ------------------ | --------- |
| CONSTRAINT_CATALOG | ❌        |
| CONSTRAINT_SCHEMA  | ❌        |
| CONSTRAINT_NAME    | ❌        |
| CHECK_CLAUSE       | ❌        |

### COLLATIONS ❌

| Column             | Supported |
| ------------------ | --------- |
| COLLATION_NAME     | ❌        |
| CHARACTER_SET_NAME | ❌        |
| ID                 | ❌        |
| IS_DEFAULT         | ❌        |
| IS_COMPILED        | ❌        |
| SORTLEN            | ❌        |
| PAD_ATTRIBUTE      | ❌        |

### COLLATION_CHARACTER_SET_APPLICABILITY ❌

| Column             | Supported |
| ------------------ | --------- |
| COLLATION_NAME     | ❌        |
| CHARACTER_SET_NAME | ❌        |

### COLUMNS ✅

| Column                   | Supported |
| ------------------------ | --------- |
| TABLE_CATALOG            | ✅        |
| TABLE_SCHEMA             | ✅        |
| TABLE_NAME               | ✅        |
| COLUMN_NAME              | ✅        |
| ORDINAL_POSITION         | ✅        |
| COLUMN_DEFAULT           | ✅        |
| IS_NULLABLE              | ✅        |
| DATA_TYPE                | ✅        |
| CHARACTER_MAXIMUM_LENGTH | ✅        |
| CHARACTER_OCTET_LENGTH   | ✅        |
| NUMERIC_PRECISION        | ✅        |
| NUMERIC_SCALE            | ✅        |
| DATETIME_PRECISION       | ✅        |
| CHARACTER_SET_NAME       | ✅        |
| COLLATION_NAME           | ✅        |
| COLUMN_TYPE              | ✅        |
| COLUMN_KEY               | ✅        |
| EXTRA                    | ✅        |
| PRIVILEGES               | ✅        |
| COLUMN_COMMENT           | ✅        |
| GENERATION_EXPRESSION    | ✅        |
| SRS_ID                   | ✅        |

### COLUMNS_EXTENSIONS ❌

| Column                     | Supported |
| -------------------------- | --------- |
| TABLE_CATALOG              | ❌        |
| TABLE_SCHEMA               | ❌        |
| TABLE_NAME                 | ❌        |
| COLUMN_NAME                | ❌        |
| ENGINE_ATTRIBUTE           | ❌        |
| SECONDARY_ENGINE_ATTRIBUTE | ❌        |

### COLUMN_PRIVILEGES ❌

| Column         | Supported |
| -------------- | --------- |
| GRANTEE        | ❌        |
| TABLE_CATALOG  | ❌        |
| TABLE_SCHEMA   | ❌        |
| TABLE_NAME     | ❌        |
| COLUMN_NAME    | ❌        |
| PRIVILEGE_TYPE | ❌        |
| IS_GRANTABLE   | ❌        |

### COLUMN_STATISTICS ❌

| Column      | Supported |
| ----------- | --------- |
| SCHEMA_NAME | ❌        |
| TABLE_NAME  | ❌        |
| COLUMN_NAME | ❌        |
| HISTOGRAM   | ❌        |

### ENABLED_ROLES ❌

| Column       | Supported |
| ------------ | --------- |
| ROLE_NAME    | ❌        |
| ROLE_HOST    | ❌        |
| IS_DEFAULT   | ❌        |
| IS_MANDATORY | ❌        |

### ENGINES ❌

| Column       | Supported |
| ------------ | --------- |
| ENGINE       | ❌        |
| SUPPORT      | ❌        |
| COMMENT      | ❌        |
| TRANSACTIONS | ❌        |
| XA           | ❌        |
| SAVEPOINTS   | ❌        |

### EVENTS ❌

| Column               | Supported |
| -------------------- | --------- |
| EVENT_CATALOG        | ❌        |
| EVENT_SCHEMA         | ❌        |
| EVENT_NAME           | ❌        |
| DEFINER              | ❌        |
| TIME_ZONE            | ❌        |
| EVENT_BODY           | ❌        |
| EVENT_DEFINITION     | ❌        |
| EVENT_TYPE           | ❌        |
| EXECUTE_AT           | ❌        |
| INTERVAL_VALUE       | ❌        |
| INTERVAL_FIELD       | ❌        |
| SQL_MODE             | ❌        |
| STARTS               | ❌        |
| ENDS                 | ❌        |
| STATUS               | ❌        |
| ON_COMPLETION        | ❌        |
| CREATED              | ❌        |
| LAST_ALTERED         | ❌        |
| LAST_EXECUTED        | ❌        |
| EVENT_COMMENT        | ❌        |
| ORIGINATOR           | ❌        |
| CHARACTER_SET_CLIENT | ❌        |
| COLLATION_CONNECTION | ❌        |
| DATABASE_COLLATION   | ❌        |

### FILES ❌

| Column               | Supported |
| -------------------- | --------- |
| FILE_ID              | ❌        |
| FILE_NAME            | ❌        |
| FILE_TYPE            | ❌        |
| TABLESPACE_NAME      | ❌        |
| TABLE_CATALOG        | ❌        |
| TABLE_SCHEMA         | ❌        |
| TABLE_NAME           | ❌        |
| LOGFILE_GROUP_NAME   | ❌        |
| LOGFILE_GROUP_NUMBER | ❌        |
| ENGINE               | ❌        |
| FULLTEXT_KEYS        | ❌        |
| DELETED_ROWS         | ❌        |
| UPDATE_COUNT         | ❌        |
| FREE_EXTENTS         | ❌        |
| TOTAL_EXTENTS        | ❌        |
| EXTENT_SIZE          | ❌        |
| INITIAL_SIZE         | ❌        |
| MAXIMUM_SIZE         | ❌        |
| AUTOEXTEND_SIZE      | ❌        |
| CREATION_TIME        | ❌        |
| LAST_UPDATE_TIME     | ❌        |
| LAST_ACCESS_TIME     | ❌        |
| RECOVER_TIME         | ❌        |
| TRANSACTION_COUNTER  | ❌        |
| VERSION              | ❌        |
| ROW_FORMAT           | ❌        |
| TABLE_ROWS           | ❌        |
| AVG_ROW_LENGTH       | ❌        |
| DATA_LENGTH          | ❌        |
| MAX_DATA_LENGTH      | ❌        |
| INDEX_LENGTH         | ❌        |
| DATA_FREE            | ❌        |
| CREATE_TIME          | ❌        |
| UPDATE_TIME          | ❌        |
| CHECK_TIME           | ❌        |
| CHECKSUM             | ❌        |
| STATUS               | ❌        |
| EXTRA                | ❌        |

### INNODB_BUFFER_PAGE ❌

| Column              | Supported |
| ------------------- | --------- |
| POOL_ID             | ❌        |
| BLOCK_ID            | ❌        |
| SPACE               | ❌        |
| PAGE_NUMBER         | ❌        |
| PAGE_TYPE           | ❌        |
| FLUSH_TYPE          | ❌        |
| FIX_COUNT           | ❌        |
| IS_HASHED           | ❌        |
| NEWEST_MODIFICATION | ❌        |
| OLDEST_MODIFICATION | ❌        |
| ACCESS_TIME         | ❌        |
| TABLE_NAME          | ❌        |
| INDEX_NAME          | ❌        |
| NUMBER_RECORDS      | ❌        |
| DATA_SIZE           | ❌        |
| COMPRESSED_SIZE     | ❌        |
| PAGE_STATE          | ❌        |
| IO_FIX              | ❌        |
| IS_OLD              | ❌        |
| FREE_PAGE_CLOCK     | ❌        |
| IS_STALE            | ❌        |

### INNODB_BUFFER_PAGE_LRU ❌

| Column              | Supported |
| ------------------- | --------- |
| POOL_ID             | ❌        |
| LRU_POSITION        | ❌        |
| SPACE               | ❌        |
| PAGE_NUMBER         | ❌        |
| PAGE_TYPE           | ❌        |
| FLUSH_TYPE          | ❌        |
| FIX_COUNT           | ❌        |
| IS_HASHED           | ❌        |
| NEWEST_MODIFICATION | ❌        |
| OLDEST_MODIFICATION | ❌        |
| ACCESS_TIME         | ❌        |
| TABLE_NAME          | ❌        |
| INDEX_NAME          | ❌        |
| NUMBER_RECORDS      | ❌        |
| DATA_SIZE           | ❌        |
| COMPRESSED_SIZE     | ❌        |
| COMPRESSED          | ❌        |
| IO_FIX              | ❌        |
| IS_OLD              | ❌        |
| FREE_PAGE_CLOCK     | ❌        |

### INNODB_BUFFER_POOL_STATS ❌

| Column                           | Supported |
| -------------------------------- | --------- |
| POOL_ID                          | ❌        |
| POOL_SIZE                        | ❌        |
| FREE_BUFFERS                     | ❌        |
| DATABASE_PAGES                   | ❌        |
| OLD_DATABASE_PAGES               | ❌        |
| MODIFIED_DATABASE_PAGES          | ❌        |
| PENDING_DECOMPRESS               | ❌        |
| PENDING_READS                    | ❌        |
| PENDING_FLUSH_LRU                | ❌        |
| PENDING_FLUSH_LIST               | ❌        |
| PAGES_MADE_YOUNG                 | ❌        |
| PAGES_NOT_MADE_YOUNG             | ❌        |
| PAGES_MADE_YOUNG_RATE            | ❌        |
| PAGES_MADE_NOT_YOUNG_RATE        | ❌        |
| NUMBER_PAGES_READ                | ❌        |
| NUMBER_PAGES_CREATED             | ❌        |
| NUMBER_PAGES_WRITTEN             | ❌        |
| PAGES_READ_RATE                  | ❌        |
| PAGES_CREATE_RATE                | ❌        |
| PAGES_WRITTEN_RATE               | ❌        |
| NUMBER_PAGES_GET                 | ❌        |
| HIT_RATE                         | ❌        |
| YOUNG_MAKE_PER_THOUSAND_GETS     | ❌        |
| NOT_YOUNG_MAKE_PER_THOUSAND_GETS | ❌        |
| NUMBER_PAGES_READ_AHEAD          | ❌        |
| NUMBER_READ_AHEAD_EVICTED        | ❌        |
| READ_AHEAD_RATE                  | ❌        |
| READ_AHEAD_EVICTED_RATE          | ❌        |
| LRU_IO_TOTAL                     | ❌        |
| LRU_IO_CURRENT                   | ❌        |
| UNCOMPRESS_TOTAL                 | ❌        |
| UNCOMPRESS_CURRENT               | ❌        |

### INNODB_CACHED_INDEXES ❌

| Column         | Supported |
| -------------- | --------- |
| SPACE_ID       | ❌        |
| INDEX_ID       | ❌        |
| N_CACHED_PAGES | ❌        |

### INNODB_CMP ❌

| Column          | Supported |
| --------------- | --------- |
| page_size       | ❌        |
| compress_ops    | ❌        |
| compress_ops_ok | ❌        |
| compress_time   | ❌        |
| uncompress_ops  | ❌        |
| uncompress_time | ❌        |

### INNODB_CMPMEM ❌

| Column               | Supported |
| -------------------- | --------- |
| page_size            | ❌        |
| buffer_pool_instance | ❌        |
| pages_used           | ❌        |
| pages_free           | ❌        |
| relocation_ops       | ❌        |
| relocation_time      | ❌        |

### INNODB_CMPMEM_RESET ❌

| Column               | Supported |
| -------------------- | --------- |
| page_size            | ❌        |
| buffer_pool_instance | ❌        |
| pages_used           | ❌        |
| pages_free           | ❌        |
| relocation_ops       | ❌        |
| relocation_time      | ❌        |

### INNODB_CMP_PER_INDEX ❌

| Column          | Supported |
| --------------- | --------- |
| database_name   | ❌        |
| table_name      | ❌        |
| index_name      | ❌        |
| compress_ops    | ❌        |
| compress_ops_ok | ❌        |
| compress_time   | ❌        |
| uncompress_ops  | ❌        |
| uncompress_time | ❌        |

### INNODB_CMP_PER_INDEX_RESET ❌

| Column          | Supported |
| --------------- | --------- |
| database_name   | ❌        |
| table_name      | ❌        |
| index_name      | ❌        |
| compress_ops    | ❌        |
| compress_ops_ok | ❌        |
| compress_time   | ❌        |
| uncompress_ops  | ❌        |
| uncompress_time | ❌        |

### INNODB_CMP_RESET ❌

| Column          | Supported |
| --------------- | --------- |
| page_size       | ❌        |
| compress_ops    | ❌        |
| compress_ops_ok | ❌        |
| compress_time   | ❌        |
| uncompress_ops  | ❌        |
| uncompress_time | ❌        |

### INNODB_COLUMNS ❌

| Column        | Supported |
| ------------- | --------- |
| TABLE_ID      | ❌        |
| NAME          | ❌        |
| POS           | ❌        |
| MTYPE         | ❌        |
| PRTYPE        | ❌        |
| LEN           | ❌        |
| HAS_DEFAULT   | ❌        |
| DEFAULT_VALUE | ❌        |

### INNODB_DATAFILES ❌

| Column | Supported |
| ------ | --------- |
| SPACE  | ❌        |
| PATH   | ❌        |

### INNODB_FIELDS ❌

| Column   | Supported |
| -------- | --------- |
| INDEX_ID | ❌        |
| NAME     | ❌        |
| POS      | ❌        |

### INNODB_FOREIGN ❌

| Column   | Supported |
| -------- | --------- |
| ID       | ❌        |
| FOR_NAME | ❌        |
| REF_NAME | ❌        |
| N_COLS   | ❌        |
| TYPE     | ❌        |

### INNODB_FOREIGN_COLS ❌

| Column       | Supported |
| ------------ | --------- |
| ID           | ❌        |
| FOR_COL_NAME | ❌        |
| REF_COL_NAME | ❌        |
| POS          | ❌        |

### INNODB_FT_BEING_DELETED ❌

| Column | Supported |
| ------ | --------- |
| DOC_ID | ❌        |

### INNODB_FT_CONFIG ❌

| Column | Supported |
| ------ | --------- |
| KEY    | ❌        |
| VALUE  | ❌        |

### INNODB_FT_DEFAULT_STOPWORD ❌

| Column | Supported |
| ------ | --------- |
| value  | ❌        |

### INNODB_FT_DELETED ❌

| Column | Supported |
| ------ | --------- |
| DOC_ID | ❌        |

### INNODB_FT_INDEX_CACHE ❌

| Column       | Supported |
| ------------ | --------- |
| WORD         | ❌        |
| FIRST_DOC_ID | ❌        |
| LAST_DOC_ID  | ❌        |
| DOC_COUNT    | ❌        |
| DOC_ID       | ❌        |
| POSITION     | ❌        |

### INNODB_FT_INDEX_TABLE ❌

| Column       | Supported |
| ------------ | --------- |
| WORD         | ❌        |
| FIRST_DOC_ID | ❌        |
| LAST_DOC_ID  | ❌        |
| DOC_COUNT    | ❌        |
| DOC_ID       | ❌        |
| POSITION     | ❌        |

### INNODB_INDEXES ❌

| Column          | Supported |
| --------------- | --------- |
| INDEX_ID        | ❌        |
| NAME            | ❌        |
| TABLE_ID        | ❌        |
| TYPE            | ❌        |
| N_FIELDS        | ❌        |
| PAGE_NO         | ❌        |
| SPACE           | ❌        |
| MERGE_THRESHOLD | ❌        |

### INNODB_METRICS ❌

| Column          | Supported |
| --------------- | --------- |
| NAME            | ❌        |
| SUBSYSTEM       | ❌        |
| COUNT           | ❌        |
| MAX_COUNT       | ❌        |
| MIN_COUNT       | ❌        |
| AVG_COUNT       | ❌        |
| COUNT_RESET     | ❌        |
| MAX_COUNT_RESET | ❌        |
| MIN_COUNT_RESET | ❌        |
| AVG_COUNT_RESET | ❌        |
| TIME_ENABLED    | ❌        |
| TIME_DISABLED   | ❌        |
| TIME_ELAPSED    | ❌        |
| TIME_RESET      | ❌        |
| STATUS          | ❌        |
| TYPE            | ❌        |
| COMMENT         | ❌        |

### INNODB_SESSION_TEMP_TABLESPACES ❌

| Column  | Supported |
| ------- | --------- |
| ID      | ❌        |
| SPACE   | ❌        |
| PATH    | ❌        |
| SIZE    | ❌        |
| STATE   | ❌        |
| PURPOSE | ❌        |

### INNODB_TABLES ❌

| Column             | Supported |
| ------------------ | --------- |
| TABLE_ID           | ❌        |
| NAME               | ❌        |
| FLAG               | ❌        |
| N_COLS             | ❌        |
| SPACE              | ❌        |
| ROW_FORMAT         | ❌        |
| ZIP_PAGE_SIZE      | ❌        |
| SPACE_TYPE         | ❌        |
| INSTANT_COLS       | ❌        |
| TOTAL_ROW_VERSIONS | ❌        |

### INNODB_TABLESPACES ❌

| Column          | Supported |
| --------------- | --------- |
| SPACE           | ❌        |
| NAME            | ❌        |
| FLAG            | ❌        |
| ROW_FORMAT      | ❌        |
| PAGE_SIZE       | ❌        |
| ZIP_PAGE_SIZE   | ❌        |
| SPACE_TYPE      | ❌        |
| FS_BLOCK_SIZE   | ❌        |
| FILE_SIZE       | ❌        |
| ALLOCATED_SIZE  | ❌        |
| AUTOEXTEND_SIZE | ❌        |
| SERVER_VERSION  | ❌        |
| SPACE_VERSION   | ❌        |
| ENCRYPTION      | ❌        |
| STATE           | ❌        |

### INNODB_TABLESPACES_BRIEF ❌

| Column     | Supported |
| ---------- | --------- |
| SPACE      | ❌        |
| NAME       | ❌        |
| PATH       | ❌        |
| FLAG       | ❌        |
| SPACE_TYPE | ❌        |

### INNODB_TABLESTATS ❌

| Column            | Supported |
| ----------------- | --------- |
| TABLE_ID          | ❌        |
| NAME              | ❌        |
| STATS_INITIALIZED | ❌        |
| NUM_ROWS          | ❌        |
| CLUST_INDEX_SIZE  | ❌        |
| OTHER_INDEX_SIZE  | ❌        |
| MODIFIED_COUNTER  | ❌        |
| AUTOINC           | ❌        |
| REF_COUNT         | ❌        |

### INNODB_TEMP_TABLE_INFO ❌

| Column   | Supported |
| -------- | --------- |
| TABLE_ID | ❌        |
| NAME     | ❌        |
| N_COLS   | ❌        |
| SPACE    | ❌        |

### INNODB_TRX ❌

| Column                     | Supported |
| -------------------------- | --------- |
| trx_id                     | ❌        |
| trx_state                  | ❌        |
| trx_started                | ❌        |
| trx_requested_lock_id      | ❌        |
| trx_wait_started           | ❌        |
| trx_weight                 | ❌        |
| trx_mysql_thread_id        | ❌        |
| trx_query                  | ❌        |
| trx_operation_state        | ❌        |
| trx_tables_in_use          | ❌        |
| trx_tables_locked          | ❌        |
| trx_lock_structs           | ❌        |
| trx_lock_memory_bytes      | ❌        |
| trx_rows_locked            | ❌        |
| trx_rows_modified          | ❌        |
| trx_concurrency_tickets    | ❌        |
| trx_isolation_level        | ❌        |
| trx_unique_checks          | ❌        |
| trx_foreign_key_checks     | ❌        |
| trx_last_foreign_key_error | ❌        |
| trx_adaptive_hash_latched  | ❌        |
| trx_adaptive_hash_timeout  | ❌        |
| trx_is_read_only           | ❌        |
| trx_autocommit_non_locking | ❌        |
| trx_schedule_weight        | ❌        |

### INNODB_VIRTUAL ❌

| Column   | Supported |
| -------- | --------- |
| TABLE_ID | ❌        |
| POS      | ❌        |
| BASE_POS | ❌        |

### KEYWORDS ❌

| Column   | Supported |
| -------- | --------- |
| WORD     | ❌        |
| RESERVED | ❌        |

### KEY_COLUMN_USAGE ❌

| Column                        | Supported |
| ----------------------------- | --------- |
| CONSTRAINT_CATALOG            | ❌        |
| CONSTRAINT_SCHEMA             | ❌        |
| CONSTRAINT_NAME               | ❌        |
| TABLE_CATALOG                 | ❌        |
| TABLE_SCHEMA                  | ❌        |
| TABLE_NAME                    | ❌        |
| COLUMN_NAME                   | ❌        |
| ORDINAL_POSITION              | ❌        |
| POSITION_IN_UNIQUE_CONSTRAINT | ❌        |
| REFERENCED_TABLE_SCHEMA       | ❌        |
| REFERENCED_TABLE_NAME         | ❌        |
| REFERENCED_COLUMN_NAME        | ❌        |

### OPTIMIZER_TRACE ❌

| Column                            | Supported |
| --------------------------------- | --------- |
| QUERY                             | ❌        |
| TRACE                             | ❌        |
| MISSING_BYTES_BEYOND_MAX_MEM_SIZE | ❌        |
| INSUFFICIENT_PRIVILEGES           | ❌        |

### PARAMETERS ❌

| Column                   | Supported |
| ------------------------ | --------- |
| SPECIFIC_CATALOG         | ❌        |
| SPECIFIC_SCHEMA          | ❌        |
| SPECIFIC_NAME            | ❌        |
| ORDINAL_POSITION         | ❌        |
| PARAMETER_MODE           | ❌        |
| PARAMETER_NAME           | ❌        |
| DATA_TYPE                | ❌        |
| CHARACTER_MAXIMUM_LENGTH | ❌        |
| CHARACTER_OCTET_LENGTH   | ❌        |
| NUMERIC_PRECISION        | ❌        |
| NUMERIC_SCALE            | ❌        |
| DATETIME_PRECISION       | ❌        |
| CHARACTER_SET_NAME       | ❌        |
| COLLATION_NAME           | ❌        |
| DTD_IDENTIFIER           | ❌        |
| ROUTINE_TYPE             | ❌        |

### PARTITIONS ❌

| Column                        | Supported |
| ----------------------------- | --------- |
| TABLE_CATALOG                 | ❌        |
| TABLE_SCHEMA                  | ❌        |
| TABLE_NAME                    | ❌        |
| PARTITION_NAME                | ❌        |
| SUBPARTITION_NAME             | ❌        |
| PARTITION_ORDINAL_POSITION    | ❌        |
| SUBPARTITION_ORDINAL_POSITION | ❌        |
| PARTITION_METHOD              | ❌        |
| SUBPARTITION_METHOD           | ❌        |
| PARTITION_EXPRESSION          | ❌        |
| SUBPARTITION_EXPRESSION       | ❌        |
| PARTITION_DESCRIPTION         | ❌        |
| TABLE_ROWS                    | ❌        |
| AVG_ROW_LENGTH                | ❌        |
| DATA_LENGTH                   | ❌        |
| MAX_DATA_LENGTH               | ❌        |
| INDEX_LENGTH                  | ❌        |
| DATA_FREE                     | ❌        |
| CREATE_TIME                   | ❌        |
| UPDATE_TIME                   | ❌        |
| CHECK_TIME                    | ❌        |
| CHECKSUM                      | ❌        |
| PARTITION_COMMENT             | ❌        |
| NODEGROUP                     | ❌        |
| TABLESPACE_NAME               | ❌        |

### PLUGINS ❌

| Column                 | Supported |
| ---------------------- | --------- |
| PLUGIN_NAME            | ❌        |
| PLUGIN_VERSION         | ❌        |
| PLUGIN_STATUS          | ❌        |
| PLUGIN_TYPE            | ❌        |
| PLUGIN_TYPE_VERSION    | ❌        |
| PLUGIN_LIBRARY         | ❌        |
| PLUGIN_LIBRARY_VERSION | ❌        |
| PLUGIN_AUTHOR          | ❌        |
| PLUGIN_DESCRIPTION     | ❌        |
| PLUGIN_LICENSE         | ❌        |
| LOAD_OPTION            | ❌        |

### PROCESSLIST ❌

| Column  | Supported |
| ------- | --------- |
| ID      | ❌        |
| USER    | ❌        |
| HOST    | ❌        |
| DB      | ❌        |
| COMMAND | ❌        |
| TIME    | ❌        |
| STATE   | ❌        |
| INFO    | ❌        |

### PROFILING ❌

| Column              | Supported |
| ------------------- | --------- |
| QUERY_ID            | ❌        |
| SEQ                 | ❌        |
| STATE               | ❌        |
| DURATION            | ❌        |
| CPU_USER            | ❌        |
| CPU_SYSTEM          | ❌        |
| CONTEXT_VOLUNTARY   | ❌        |
| CONTEXT_INVOLUNTARY | ❌        |
| BLOCK_OPS_IN        | ❌        |
| BLOCK_OPS_OUT       | ❌        |
| MESSAGES_SENT       | ❌        |
| MESSAGES_RECEIVED   | ❌        |
| PAGE_FAULTS_MAJOR   | ❌        |
| PAGE_FAULTS_MINOR   | ❌        |
| SWAPS               | ❌        |
| SOURCE_FUNCTION     | ❌        |
| SOURCE_FILE         | ❌        |
| SOURCE_LINE         | ❌        |

### REFERENTIAL_CONSTRAINTS ❌

| Column                    | Supported |
| ------------------------- | --------- |
| CONSTRAINT_CATALOG        | ❌        |
| CONSTRAINT_SCHEMA         | ❌        |
| CONSTRAINT_NAME           | ❌        |
| UNIQUE_CONSTRAINT_CATALOG | ❌        |
| UNIQUE_CONSTRAINT_SCHEMA  | ❌        |
| UNIQUE_CONSTRAINT_NAME    | ❌        |
| MATCH_OPTION              | ❌        |
| UPDATE_RULE               | ❌        |
| DELETE_RULE               | ❌        |
| TABLE_NAME                | ❌        |
| REFERENCED_TABLE_NAME     | ❌        |

### RESOURCE_GROUPS ❌

| Column                 | Supported |
| ---------------------- | --------- |
| RESOURCE_GROUP_NAME    | ❌        |
| RESOURCE_GROUP_TYPE    | ❌        |
| RESOURCE_GROUP_ENABLED | ❌        |
| VCPU_IDS               | ❌        |
| THREAD_PRIORITY        | ❌        |

### ROLE_COLUMN_GRANTS ❌

| Column         | Supported |
| -------------- | --------- |
| GRANTOR        | ❌        |
| GRANTOR_HOST   | ❌        |
| GRANTEE        | ❌        |
| GRANTEE_HOST   | ❌        |
| TABLE_CATALOG  | ❌        |
| TABLE_SCHEMA   | ❌        |
| TABLE_NAME     | ❌        |
| COLUMN_NAME    | ❌        |
| PRIVILEGE_TYPE | ❌        |
| IS_GRANTABLE   | ❌        |

### ROLE_ROUTINE_GRANTS ❌

| Column           | Supported |
| ---------------- | --------- |
| GRANTOR          | ❌        |
| GRANTOR_HOST     | ❌        |
| GRANTEE          | ❌        |
| GRANTEE_HOST     | ❌        |
| SPECIFIC_CATALOG | ❌        |
| SPECIFIC_SCHEMA  | ❌        |
| SPECIFIC_NAME    | ❌        |
| ROUTINE_CATALOG  | ❌        |
| ROUTINE_SCHEMA   | ❌        |
| ROUTINE_NAME     | ❌        |
| PRIVILEGE_TYPE   | ❌        |
| IS_GRANTABLE     | ❌        |

### ROLE_TABLE_GRANTS ❌

| Column         | Supported |
| -------------- | --------- |
| GRANTOR        | ❌        |
| GRANTOR_HOST   | ❌        |
| GRANTEE        | ❌        |
| GRANTEE_HOST   | ❌        |
| TABLE_CATALOG  | ❌        |
| TABLE_SCHEMA   | ❌        |
| TABLE_NAME     | ❌        |
| PRIVILEGE_TYPE | ❌        |
| IS_GRANTABLE   | ❌        |

### ROUTINES ❌

| Column                   | Supported |
| ------------------------ | --------- |
| SPECIFIC_NAME            | ❌        |
| ROUTINE_CATALOG          | ❌        |
| ROUTINE_SCHEMA           | ❌        |
| ROUTINE_NAME             | ❌        |
| ROUTINE_TYPE             | ❌        |
| DATA_TYPE                | ❌        |
| CHARACTER_MAXIMUM_LENGTH | ❌        |
| CHARACTER_OCTET_LENGTH   | ❌        |
| NUMERIC_PRECISION        | ❌        |
| NUMERIC_SCALE            | ❌        |
| DATETIME_PRECISION       | ❌        |
| CHARACTER_SET_NAME       | ❌        |
| COLLATION_NAME           | ❌        |
| DTD_IDENTIFIER           | ❌        |
| ROUTINE_BODY             | ❌        |
| ROUTINE_DEFINITION       | ❌        |
| EXTERNAL_NAME            | ❌        |
| EXTERNAL_LANGUAGE        | ❌        |
| PARAMETER_STYLE          | ❌        |
| IS_DETERMINISTIC         | ❌        |
| SQL_DATA_ACCESS          | ❌        |
| SQL_PATH                 | ❌        |
| SECURITY_TYPE            | ❌        |
| CREATED                  | ❌        |
| LAST_ALTERED             | ❌        |
| SQL_MODE                 | ❌        |
| ROUTINE_COMMENT          | ❌        |
| DEFINER                  | ❌        |
| CHARACTER_SET_CLIENT     | ❌        |
| COLLATION_CONNECTION     | ❌        |
| DATABASE_COLLATION       | ❌        |

### SCHEMATA ✅

| Column                     | Supported |
| -------------------------- | --------- |
| CATALOG_NAME               | ✅        |
| SCHEMA_NAME                | ✅        |
| DEFAULT_CHARACTER_SET_NAME | ✅        |
| DEFAULT_COLLATION_NAME     | ✅        |
| SQL_PATH                   | ✅        |
| DEFAULT_ENCRYPTION         | ✅        |

### SCHEMATA_EXTENSIONS ❌

| Column       | Supported |
| ------------ | --------- |
| CATALOG_NAME | ❌        |
| SCHEMA_NAME  | ❌        |
| OPTIONS      | ❌        |

### SCHEMA_PRIVILEGES ❌

| Column         | Supported |
| -------------- | --------- |
| GRANTEE        | ❌        |
| TABLE_CATALOG  | ❌        |
| TABLE_SCHEMA   | ❌        |
| PRIVILEGE_TYPE | ❌        |
| IS_GRANTABLE   | ❌        |

### STATISTICS ❌

| Column        | Supported |
| ------------- | --------- |
| TABLE_CATALOG | ❌        |
| TABLE_SCHEMA  | ❌        |
| TABLE_NAME    | ❌        |
| NON_UNIQUE    | ❌        |
| INDEX_SCHEMA  | ❌        |
| INDEX_NAME    | ❌        |
| SEQ_IN_INDEX  | ❌        |
| COLUMN_NAME   | ❌        |
| COLLATION     | ❌        |
| CARDINALITY   | ❌        |
| SUB_PART      | ❌        |
| PACKED        | ❌        |
| NULLABLE      | ❌        |
| INDEX_TYPE    | ❌        |
| COMMENT       | ❌        |
| INDEX_COMMENT | ❌        |
| IS_VISIBLE    | ❌        |
| EXPRESSION    | ❌        |

### ST_GEOMETRY_COLUMNS ❌

| Column             | Supported |
| ------------------ | --------- |
| TABLE_CATALOG      | ❌        |
| TABLE_SCHEMA       | ❌        |
| TABLE_NAME         | ❌        |
| COLUMN_NAME        | ❌        |
| SRS_NAME           | ❌        |
| SRS_ID             | ❌        |
| GEOMETRY_TYPE_NAME | ❌        |

### ST_SPATIAL_REFERENCE_SYSTEMS ❌

| Column                   | Supported |
| ------------------------ | --------- |
| SRS_NAME                 | ❌        |
| SRS_ID                   | ❌        |
| ORGANIZATION             | ❌        |
| ORGANIZATION_COORDSYS_ID | ❌        |
| DEFINITION               | ❌        |
| DESCRIPTION              | ❌        |

### ST_UNITS_OF_MEASURE ❌

| Column            | Supported |
| ----------------- | --------- |
| UNIT_NAME         | ❌        |
| UNIT_TYPE         | ❌        |
| CONVERSION_FACTOR | ❌        |
| DESCRIPTION       | ❌        |

### TABLES ✅

| Column          | Supported |
| --------------- | --------- |
| TABLE_CATALOG   | ✅        |
| TABLE_SCHEMA    | ✅        |
| TABLE_NAME      | ✅        |
| TABLE_TYPE      | ✅        |
| ENGINE          | ✅        |
| VERSION         | ✅        |
| ROW_FORMAT      | ✅        |
| TABLE_ROWS      | ✅        |
| AVG_ROW_LENGTH  | ✅        |
| DATA_LENGTH     | ✅        |
| MAX_DATA_LENGTH | ✅        |
| INDEX_LENGTH    | ✅        |
| DATA_FREE       | ✅        |
| AUTO_INCREMENT  | ✅        |
| CREATE_TIME     | ❌        |
| UPDATE_TIME     | ✅        |
| CHECK_TIME      | ✅        |
| TABLE_COLLATION | ✅        |
| CHECKSUM        | ✅        |
| CREATE_OPTIONS  | ✅        |
| TABLE_COMMENT   | ✅        |

### TABLESPACES_EXTENSIONS ❌

| Column           | Supported |
| ---------------- | --------- |
| TABLESPACE_NAME  | ❌        |
| ENGINE_ATTRIBUTE | ❌        |

### TABLES_EXTENSIONS ❌

| Column                     | Supported |
| -------------------------- | --------- |
| TABLE_CATALOG              | ❌        |
| TABLE_SCHEMA               | ❌        |
| TABLE_NAME                 | ❌        |
| ENGINE_ATTRIBUTE           | ❌        |
| SECONDARY_ENGINE_ATTRIBUTE | ❌        |

### TABLE_CONSTRAINTS ❌

| Column             | Supported |
| ------------------ | --------- |
| CONSTRAINT_CATALOG | ❌        |
| CONSTRAINT_SCHEMA  | ❌        |
| CONSTRAINT_NAME    | ❌        |
| TABLE_SCHEMA       | ❌        |
| TABLE_NAME         | ❌        |
| CONSTRAINT_TYPE    | ❌        |
| ENFORCED           | ❌        |

### TABLE_CONSTRAINTS_EXTENSIONS ❌

| Column                     | Supported |
| -------------------------- | --------- |
| CONSTRAINT_CATALOG         | ❌        |
| CONSTRAINT_SCHEMA          | ❌        |
| CONSTRAINT_NAME            | ❌        |
| TABLE_NAME                 | ❌        |
| ENGINE_ATTRIBUTE           | ❌        |
| SECONDARY_ENGINE_ATTRIBUTE | ❌        |

### TABLE_PRIVILEGES ❌

| Column         | Supported |
| -------------- | --------- |
| GRANTEE        | ❌        |
| TABLE_CATALOG  | ❌        |
| TABLE_SCHEMA   | ❌        |
| TABLE_NAME     | ❌        |
| PRIVILEGE_TYPE | ❌        |
| IS_GRANTABLE   | ❌        |

### TRIGGERS ❌

| Column                     | Supported |
| -------------------------- | --------- |
| TRIGGER_CATALOG            | ❌        |
| TRIGGER_SCHEMA             | ❌        |
| TRIGGER_NAME               | ❌        |
| EVENT_MANIPULATION         | ❌        |
| EVENT_OBJECT_CATALOG       | ❌        |
| EVENT_OBJECT_SCHEMA        | ❌        |
| EVENT_OBJECT_TABLE         | ❌        |
| ACTION_ORDER               | ❌        |
| ACTION_CONDITION           | ❌        |
| ACTION_STATEMENT           | ❌        |
| ACTION_ORIENTATION         | ❌        |
| ACTION_TIMING              | ❌        |
| ACTION_REFERENCE_OLD_TABLE | ❌        |
| ACTION_REFERENCE_NEW_TABLE | ❌        |
| ACTION_REFERENCE_OLD_ROW   | ❌        |
| ACTION_REFERENCE_NEW_ROW   | ❌        |
| CREATED                    | ❌        |
| SQL_MODE                   | ❌        |
| DEFINER                    | ❌        |
| CHARACTER_SET_CLIENT       | ❌        |
| COLLATION_CONNECTION       | ❌        |
| DATABASE_COLLATION         | ❌        |

### USER_ATTRIBUTES ❌

| Column    | Supported |
| --------- | --------- |
| USER      | ❌        |
| HOST      | ❌        |
| ATTRIBUTE | ❌        |

### USER_PRIVILEGES ❌

| Column         | Supported |
| -------------- | --------- |
| GRANTEE        | ❌        |
| TABLE_CATALOG  | ❌        |
| PRIVILEGE_TYPE | ❌        |
| IS_GRANTABLE   | ❌        |

### VIEWS ❌

| Column               | Supported |
| -------------------- | --------- |
| TABLE_CATALOG        | ❌        |
| TABLE_SCHEMA         | ❌        |
| TABLE_NAME           | ❌        |
| VIEW_DEFINITION      | ❌        |
| CHECK_OPTION         | ❌        |
| IS_UPDATABLE         | ❌        |
| DEFINER              | ❌        |
| SECURITY_TYPE        | ❌        |
| CHARACTER_SET_CLIENT | ❌        |
| COLLATION_CONNECTION | ❌        |

### VIEW_ROUTINE_USAGE ❌

| Column           | Supported |
| ---------------- | --------- |
| TABLE_CATALOG    | ❌        |
| TABLE_SCHEMA     | ❌        |
| TABLE_NAME       | ❌        |
| SPECIFIC_CATALOG | ❌        |
| SPECIFIC_SCHEMA  | ❌        |
| SPECIFIC_NAME    | ❌        |

### VIEW_TABLE_USAGE ❌

| Column        | Supported |
| ------------- | --------- |
| VIEW_CATALOG  | ❌        |
| VIEW_SCHEMA   | ❌        |
| VIEW_NAME     | ❌        |
| TABLE_CATALOG | ❌        |
| TABLE_SCHEMA  | ❌        |
| TABLE_NAME    | ❌        |
