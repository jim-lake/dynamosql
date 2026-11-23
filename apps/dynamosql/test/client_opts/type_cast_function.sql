-- typeCast function form: callers uppercase string fields, others use the default cast
SELECT 'abc' AS s, CAST(7 AS SIGNED) AS n;
