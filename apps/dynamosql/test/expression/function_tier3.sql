-- Test ELT()
SELECT ELT(1, 'a', 'b', 'c') AS elt_1;
SELECT ELT(2, 'a', 'b', 'c') AS elt_2;
SELECT ELT(3, 'a', 'b', 'c') AS elt_3;
SELECT ELT(0, 'a', 'b', 'c') AS elt_0;
SELECT ELT(4, 'a', 'b', 'c') AS elt_4;
SELECT ELT(NULL, 'a', 'b', 'c') AS elt_null;

-- Test FIELD()
SELECT FIELD('b', 'a', 'b', 'c') AS field_b;
SELECT FIELD('a', 'a', 'b', 'c') AS field_a;
SELECT FIELD('c', 'a', 'b', 'c') AS field_c;
SELECT FIELD('d', 'a', 'b', 'c') AS field_d;
SELECT FIELD(NULL, 'a', 'b', 'c') AS field_null;

-- Test FIND_IN_SET()
SELECT FIND_IN_SET('b', 'a,b,c') AS find_b;
SELECT FIND_IN_SET('a', 'a,b,c') AS find_a;
SELECT FIND_IN_SET('c', 'a,b,c') AS find_c;
SELECT FIND_IN_SET('d', 'a,b,c') AS find_d;
SELECT FIND_IN_SET(NULL, 'a,b,c') AS find_null;

-- Test SUBSTRING_INDEX()
SELECT SUBSTRING_INDEX('a.b.c', '.', 1) AS sub_idx_1;
SELECT SUBSTRING_INDEX('a.b.c', '.', 2) AS sub_idx_2;
SELECT SUBSTRING_INDEX('a.b.c', '.', -1) AS sub_idx_neg1;
SELECT SUBSTRING_INDEX('a.b.c', '.', -2) AS sub_idx_neg2;
SELECT SUBSTRING_INDEX('a.b.c', '.', 0) AS sub_idx_0;

-- Test INSERT()
SELECT INSERT('hello', 2, 3, 'XYZ') AS insert_test;
SELECT INSERT('hello', 1, 2, 'AB') AS insert_start;
SELECT INSERT('hello', 6, 0, 'X') AS insert_end;
SELECT INSERT('hello', 10, 0, 'X') AS insert_beyond;

-- Test MAKE_SET()
SELECT MAKE_SET(1, 'a', 'b', 'c') AS make_set_1;
SELECT MAKE_SET(5, 'a', 'b', 'c') AS make_set_5;
SELECT MAKE_SET(7, 'a', 'b', 'c') AS make_set_7;
SELECT MAKE_SET(0, 'a', 'b', 'c') AS make_set_0;

-- Test EXPORT_SET()
SELECT EXPORT_SET(5, 'Y', 'N', ',', 4) AS export_set_test;
SELECT EXPORT_SET(6, '1', '0', ',', 4) AS export_set_6;

-- Test FORMAT()
SELECT FORMAT(12332.123456, 2) AS format_test;
SELECT FORMAT(12332.1, 4) AS format_pad;
SELECT FORMAT(1234567.89, 2) AS format_large;

-- Test CHAR()
SELECT CHAR(72, 101, 108, 108, 111) AS char_hello;
SELECT CHAR(65, 66, 67) AS char_abc;
