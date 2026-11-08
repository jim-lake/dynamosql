SELECT JSON_VALUE('{"a":1}', 'a') AS result;
SELECT JSON_VALUE('[1]', 'a') AS result;
SELECT JSON_VALUE(5, '$') AS result;
