CREATE DATABASE IF NOT EXISTS mem_ai_ci_key;
USE mem_ai_ci_key;

CREATE TEMPORARY TABLE ai_u (id INT PRIMARY KEY, us VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci, UNIQUE KEY us_u (us));
INSERT INTO ai_u VALUES (1, 'e'), (3, 'ß');
SELECT * FROM ai_u ORDER BY id;
SELECT id FROM ai_u WHERE us = 'É' ORDER BY id;
SELECT id FROM ai_u WHERE us = 'E' ORDER BY id;
SELECT id FROM ai_u WHERE us = 'ss' ORDER BY id;
SELECT id FROM ai_u WHERE us = 'SS' ORDER BY id;
SELECT id FROM ai_u WHERE us = 'ß' ORDER BY id;
SELECT id FROM ai_u WHERE us = 'x' ORDER BY id;
SELECT * FROM ai_u ORDER BY id;
SELECT id FROM ai_u WHERE us = 'a' ORDER BY id;
DELETE FROM ai_u WHERE us = 'ß';
SELECT id FROM ai_u ORDER BY id;

CREATE TEMPORARY TABLE ai_p (k VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci PRIMARY KEY, v INT);
INSERT INTO ai_p VALUES ('e', 1), ('ß', 3);
SELECT v FROM ai_p WHERE k = 'é' ORDER BY v;
SELECT v FROM ai_p WHERE k = 'SS' ORDER BY v;
SELECT * FROM ai_p ORDER BY k;

CREATE TEMPORARY TABLE ai_r (id INT PRIMARY KEY, s VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci, KEY s_k (s));
INSERT INTO ai_r VALUES (1, 'b'), (2, 'É'), (3, 'e'), (4, 'f'), (5, 'ß'), (6, 't'), (7, 'E');
SELECT id, s FROM ai_r WHERE s >= 'e' AND s < 'f' ORDER BY s, id;
SELECT id FROM ai_r WHERE s = 'é' ORDER BY id;
SELECT id FROM ai_r WHERE s = 'ss' ORDER BY id;
SELECT id FROM ai_r WHERE s = 'e' ORDER BY id;

DROP DATABASE mem_ai_ci_key;
