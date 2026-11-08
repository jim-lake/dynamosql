CREATE TEMPORARY TABLE temp_memory (id INT PRIMARY KEY, name VARCHAR(256)) ENGINE=MEMORY;
INSERT INTO temp_memory (id, name) VALUES (1, "temp1"), (2, "temp2");
SELECT * FROM temp_memory ORDER BY id;
CREATE TEMPORARY TABLE temp_raw (id INT PRIMARY KEY, name VARCHAR(256)) ENGINE=RAW;
INSERT INTO temp_raw (id, name) VALUES (10, "raw1"), (20, "raw2");
SELECT * FROM temp_raw ORDER BY id;
