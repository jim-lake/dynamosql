SELECT JSON_SEARCH('["x"]', 'bad', 'x') AS json_value;
SELECT JSON_SEARCH('["x"]', 'one', 'x', 'ab') AS json_value;
SELECT JSON_SEARCH('["x"]', 'one', 'x', '$[0]') AS json_value;
SELECT JSON_SEARCH('not json', 'one', 'x') AS json_value;
SELECT JSON_SEARCH('["x"]', 'one', 'x', NULL, 'a') AS json_value;
SELECT JSON_SEARCH('["x"]', 'one') AS json_value;
SELECT JSON_SEARCH() AS json_value;
