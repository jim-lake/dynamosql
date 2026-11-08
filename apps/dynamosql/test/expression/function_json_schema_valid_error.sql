SELECT JSON_SCHEMA_VALID('{"type":"object"}', 'not json') AS is_valid;
SELECT JSON_SCHEMA_VALID('{"type":"object"}', 5) AS is_valid;
