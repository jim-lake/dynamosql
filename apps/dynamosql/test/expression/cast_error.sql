SELECT CAST('abc' AS JSON) AS json_value;
SELECT CAST('' AS JSON) AS json_value;
SELECT CAST('   ' AS JSON) AS json_value;
SELECT CAST('[1,]' AS JSON) AS json_value;
SELECT CAST('1 2' AS JSON) AS json_value;
SELECT CAST('NaN' AS JSON) AS json_value;
SELECT CAST("{'a':1}" AS JSON) AS json_value;
