-- LIMIT with offset,count form
SELECT id, other FROM _dynamodb.foo ORDER BY id LIMIT 1, 2;
SELECT id, other FROM _dynamodb.foo ORDER BY id LIMIT 0, 100;
SELECT id, other FROM _dynamodb.foo ORDER BY id LIMIT 5, 10;

-- Modulo operator
SELECT 5 % 2 AS m1;
SELECT 7 % -3 AS m2;
SELECT 10.5 % 3 AS m3;
SELECT id, other % 2 AS mod_other FROM _dynamodb.foo WHERE other IS NOT NULL ORDER BY id;

-- User variable assignment in select list
SELECT @x := 5;
SELECT @x AS x;
SELECT @y := 'abc', @y;

-- Hex literals
SELECT X'41' AS hex_upper, 0x41 AS hex_prefix;
SELECT X'4142' AS hex_pair, HEX(X'4142') AS hex_text;

-- String quoting
SELECT 'it''s' AS single_doubled;
SELECT "say ""hi""" AS double_doubled;
SELECT 'a\'b' AS backslash_quote;

-- Comments and optimizer hints
SELECT /* block comment */ 1 AS v;
SELECT id /* inline comment */ FROM _dynamodb.foo ORDER BY id;

-- JSON paths
SELECT JSON_EXTRACT('[1,2,3]', '$[last]') AS last_item;
SELECT JSON_EXTRACT('{"a b": 1}', '$."a b"') AS quoted_member;
SELECT JSON_EXTRACT('{"a": 1}', '$."a"') AS quoted_plain;

-- Modulo with NULL and zero divisor
SELECT 5 % 0 AS zero_div, NULL % 2 AS null_op;
