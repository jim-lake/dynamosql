SELECT JSON_OBJECT('a', 1, 'b') AS json_value;
SELECT JSON_OBJECT('a') AS json_value;
SELECT JSON_OBJECT(NULL, 1) AS json_value;
SELECT JSON_OBJECT('a', 1, NULL, 2) AS json_value;
