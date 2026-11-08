SELECT JSON_PRETTY('[1,2') AS json_value;
SELECT JSON_PRETTY('not json') AS json_value;
SELECT JSON_PRETTY(5) AS json_value;
SELECT JSON_PRETTY(TRUE) AS json_value;
SELECT JSON_PRETTY() AS json_value;
SELECT JSON_PRETTY('[1]', '[2]') AS json_value;
