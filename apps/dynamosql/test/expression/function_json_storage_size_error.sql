SELECT JSON_STORAGE_SIZE('not json') > 0 AS json_value;
SELECT JSON_STORAGE_SIZE(5) > 0 AS json_value;
SELECT JSON_STORAGE_SIZE() AS json_value;
SELECT JSON_STORAGE_SIZE('[1]', '$') > 0 AS json_value;
