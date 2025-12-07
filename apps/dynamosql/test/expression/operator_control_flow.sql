-- DIV operator (integer division)
SELECT 10 DIV 3 AS div_basic;
SELECT 10 DIV 4 AS div_even;
SELECT 10 DIV 0 AS div_zero;
SELECT NULL DIV 3 AS div_null;
SELECT 10.5 DIV 2 AS div_float;
SELECT -10 DIV 3 AS div_negative;

-- && operator (logical AND alias)
SELECT 1 && 1 AS and_true;
SELECT 1 && 0 AS and_false;
SELECT 0 && 0 AS and_both_false;
SELECT NULL && 1 AS and_null_true;
SELECT NULL && 0 AS and_null_false;

-- || operator (logical OR alias)
SELECT 1 || 0 AS or_true;
SELECT 0 || 0 AS or_false;
SELECT 1 || 1 AS or_both_true;
SELECT NULL || 1 AS or_null_true;
SELECT NULL || 0 AS or_null_false;

-- BETWEEN operator
SELECT 5 BETWEEN 1 AND 10 AS between_true;
SELECT 15 BETWEEN 1 AND 10 AS between_false;
SELECT 1 BETWEEN 1 AND 10 AS between_min;
SELECT 10 BETWEEN 1 AND 10 AS between_max;
SELECT NULL BETWEEN 1 AND 10 AS between_null;
SELECT 5 BETWEEN NULL AND 10 AS between_null_min;
SELECT 5 BETWEEN 1 AND NULL AS between_null_max;
SELECT 'b' BETWEEN 'a' AND 'c' AS between_string;

-- NOT BETWEEN operator
SELECT 5 NOT BETWEEN 1 AND 10 AS not_between_false;
SELECT 15 NOT BETWEEN 1 AND 10 AS not_between_true;

-- := assignment operator
SELECT @test_var := 42 AS assign_result;
SELECT @test_var AS retrieve_var;
SELECT @test_var := @test_var + 1 AS increment_var;
SELECT @test_var AS retrieve_incremented;
SELECT @str_var := 'hello' AS assign_string;
SELECT @str_var AS retrieve_string;
