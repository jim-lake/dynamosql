-- supportBigNumbers, bigNumberStrings: BIGINT above 2^53 as strings, safe values as numbers
USE _dynamodb;
SELECT CAST(42 AS SIGNED) AS big_safe, CAST(9007199254740993 AS SIGNED) AS big_above;
