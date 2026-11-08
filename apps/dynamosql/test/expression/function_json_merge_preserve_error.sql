SELECT JSON_MERGE_PRESERVE('{"a":1}') AS json_value;
SELECT JSON_MERGE_PRESERVE('{"a":1}', 'not json') AS json_value;
SELECT JSON_MERGE_PRESERVE('{"a":1}', '{"a":2}', 'x') AS json_value;
SELECT JSON_MERGE_PRESERVE('1', 2) AS json_value;
