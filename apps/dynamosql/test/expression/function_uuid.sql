-- UUID tests
SELECT LENGTH(UUID()) AS uuid_length;
SELECT UUID() LIKE '%-%-%-%-%' AS uuid_format;
SELECT IS_UUID('550e8400-e29b-41d4-a716-446655440000') AS is_uuid_valid;
SELECT IS_UUID('not-a-uuid') AS is_uuid_invalid;
SELECT IS_UUID('') AS is_uuid_empty;
SELECT IS_UUID(NULL) AS is_uuid_null;
SELECT IS_UUID(UUID()) AS is_uuid_generated;
