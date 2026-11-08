SELECT JSON_STORAGE_FREE('not json') AS json_value;
SELECT JSON_STORAGE_FREE(5) AS json_value;
SELECT JSON_STORAGE_FREE() AS json_value;
SELECT JSON_STORAGE_FREE('[1]', '$') AS json_value;
