-- Test USER() and aliases - just check they return strings
SELECT LENGTH(USER()) > 0 AS user_test;
SELECT LENGTH(CURRENT_USER()) > 0 AS current_user_test;
SELECT LENGTH(SESSION_USER()) > 0 AS session_user_test;
SELECT LENGTH(SYSTEM_USER()) > 0 AS system_user_test;

-- Test VERSION() - just check it returns a string
SELECT LENGTH(VERSION()) > 0 AS version_test;

-- Test CONNECTION_ID() - just check it returns a positive number
SELECT CONNECTION_ID() > 0 AS conn_id_positive;
