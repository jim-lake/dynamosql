-- decimalNumbers option: DECIMAL column values as strings (false) or numbers (true)
USE _dynamodb;
CREATE TEMPORARY TABLE _dynamodb.client_opts_decimal (id INT PRIMARY KEY, d DECIMAL(10,2));
INSERT INTO _dynamodb.client_opts_decimal (id, d) VALUES (1, 1.5), (2, NULL);
SELECT id, d FROM _dynamodb.client_opts_decimal ORDER BY id;
DROP TEMPORARY TABLE _dynamodb.client_opts_decimal;
