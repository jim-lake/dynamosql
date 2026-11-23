# mysql2 compatibility gaps

## DECIMAL scale in computed expressions (decimalNumbers false)

With the default `decimalNumbers: false`, DECIMAL values from computed expressions (CAST, arithmetic) come back without the declared scale's trailing zeros. The expression result does not carry its scale into column metadata (column `decimals` is 31).

- Table `t` with `d DECIMAL(10,2)` holding `1.5`: `SELECT CAST(1.5 AS DECIMAL(10,2)) AS a, d + 1 AS b FROM t;`. mysql2 against MySQL returns `'1.50'` and `'2.50'`. DynamoSQL returns `'1.5'` and `'2.5'`.
- Real DECIMAL table columns format correctly (`'1.50'`).
- With `decimalNumbers: true`, both sides return numbers.
