SELECT LEFT("", 1) AS foo;
SELECT LEFT("", 2) AS foo;
SELECT LEFT("abcdefg", 1) AS foo;
SELECT LEFT("abcdefg", 2) AS foo;
SELECT LEFT("abcdefg", 3) AS foo;
SELECT LEFT("abcdefg", 4) AS foo;
SELECT LEFT("abcdefg", 5) AS foo;
SELECT LEFT("abcdefg", 6) AS foo;
SELECT LEFT("abcdefg", 7) AS foo;
SELECT LEFT("abcdefg", 8) AS foo;
SELECT LEFT("abcdefg", 9) AS foo;
SELECT LEFT("abcdefg", 10) AS foo;
SELECT LEFT("abcdefg", 10) AS foo;
SELECT LEFT("abcdefg", 0) AS foo;
SELECT LEFT("abcdefg", -1) AS foo;
SELECT LEFT("abcdefg", -9) AS foo;
SELECT LEFT("abcdefg", -99) AS foo;
SELECT LEFT("abcdefg", "foo") AS foo;
SELECT LEFT("abcdefg", "1foo") AS foo;
SELECT LEFT("abcdefg", "4foo") AS foo;
SELECT LEFT("abcdefg", "-1foo") AS foo;
SELECT LEFT("abcdefg", null) AS foo;
SELECT LEFT(null, 1) AS foo;
-- check table before we run
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
-- with column refs
SELECT LEFT(comment, other) AS foo FROM _dynamodb.foo WHERE id = "4";
SELECT LEFT(comment, -other) AS foo FROM _dynamodb.foo WHERE id = "4";
SELECT LEFT(comment, other - 999) AS foo FROM _dynamodb.foo WHERE id = "4";
SELECT LEFT(comment, other - 105) AS foo FROM _dynamodb.foo WHERE id = "4";
SELECT LEFT(comment, 119 - other) AS foo FROM _dynamodb.foo WHERE id = "4";
SELECT LEFT(comment, other) AS foo FROM _dynamodb.foo WHERE id = "99";
SELECT LEFT(comment, -other) AS foo FROM _dynamodb.foo WHERE id = "99";
SELECT LEFT(comment, other - 999) AS foo FROM _dynamodb.foo WHERE id = "99";
SELECT LEFT(comment, other - 105) AS foo FROM _dynamodb.foo WHERE id = "99";
SELECT LEFT(comment, 119 - other) AS foo FROM _dynamodb.foo WHERE id = "99";
SELECT LEFT(comment, other) AS foo FROM _dynamodb.foo WHERE id = "111";
SELECT LEFT(comment, -other) AS foo FROM _dynamodb.foo WHERE id = "111";
SELECT LEFT(comment, other - 999) AS foo FROM _dynamodb.foo WHERE id = "111";
SELECT LEFT(comment, other - 105) AS foo FROM _dynamodb.foo WHERE id = "111";
SELECT LEFT(comment, 119 - other) AS foo FROM _dynamodb.foo WHERE id = "111";

SELECT LENGTH("") AS foo;
SELECT LENGTH("ab") AS foo;
SELECT LENGTH("abc") AS foo;
SELECT LENGTH("abcd") AS foo;
SELECT LENGTH("abcde") AS foo;
SELECT LENGTH("abcdef") AS foo;
SELECT LENGTH("abcdefg") AS foo;
SELECT LENGTH(null) AS foo;
SELECT LENGTH(comment) AS foo FROM _dynamodb.foo WHERE id = "4";
SELECT LENGTH(comment) AS foo FROM _dynamodb.foo WHERE id = "99";
SELECT LENGTH(comment) AS foo FROM _dynamodb.foo WHERE id = "111";

SELECT LEFT("abcdefg", LENGTH("abcdefg") - 1) AS foo;
SELECT LEFT("abcdefg", LENGTH("abcdefg") - 2) AS foo;
SELECT LEFT("abcdefg", LENGTH("abcdefg") - 3) AS foo;
SELECT LEFT("abcdefg", LENGTH("abcdefg") - 4) AS foo;
SELECT LEFT("abcdefg", LENGTH("abcdefg") - 6) AS foo;
SELECT LEFT("abcdefg", LENGTH("abcdefg") - 7) AS foo;
SELECT LEFT("abcdefg", LENGTH("abcdefg") - 8) AS foo;
SELECT LEFT("abcdefg", LENGTH("abcdefg") - 9) AS foo;
SELECT LEFT("abcdefg", LENGTH("abcdefg") - 10) AS foo;
SELECT LEFT("abcdefg", LENGTH("abcdefg") + 1) AS foo;
SELECT LEFT("abcdefg", LENGTH("abcdefg") + 2) AS foo;
SELECT LEFT("abcdefg", LENGTH("abcdefg") + 3) AS foo;
SELECT LEFT("abcdefg", LENGTH("abcdefg") + 4) AS foo;
SELECT LEFT("abcdefg", LENGTH("abcdefg") + 5) AS foo;