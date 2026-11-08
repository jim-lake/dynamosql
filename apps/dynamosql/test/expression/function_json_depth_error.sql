SELECT JSON_DEPTH('not json') AS json_value;
SELECT JSON_DEPTH('[1,]') AS json_value;
SELECT JSON_DEPTH(5) AS json_value;
SELECT JSON_DEPTH(TRUE) AS json_value;
SELECT JSON_DEPTH() AS json_value;
SELECT JSON_DEPTH('[1]', '$') AS json_value;
