DELETE FROM _dynamodb.foo;
INSERT IGNORE INTO _dynamodb.foo (id, other, comment) VALUES
  ("4", 4, "4 comment"),
  ("99", null, "99 comment with null"),
  ("111", 111, "111 comment"),
  ("112", 222, "112 comment"),
  ("113", 333, "113 comment"),
  ("114", null, "114 comment with null"),
  ("115", 222, "115 comment dup 222")
;
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;

DELETE FROM _dynamodb.foo WHERE id ="123123";
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
DELETE FROM _dynamodb.foo WHERE other = 999199;
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
DELETE FROM _dynamodb.foo WHERE comment = "missing";
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
DELETE FROM _dynamodb.foo WHERE id = "4" AND comment = "missing";
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;


DELETE FROM _dynamodb.foo WHERE id = "113";
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
DELETE FROM _dynamodb.foo WHERE id = "4";
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
DELETE FROM _dynamodb.foo;
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;

INSERT IGNORE INTO _dynamodb.foo (id, other, comment) VALUES
  ("4", 4, "4 comment"),
  ("99", null, "99 comment with null"),
  ("111", 111, "111 comment"),
  ("112", 222, "112 comment"),
  ("113", 333, "113 comment"),
  ("114", null, "114 comment with null"),
  ("115", 222, "115 comment dup 222")
;
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;

DELETE FROM _dynamodb.foo WHERE id = "4" OR id = "115";
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
DELETE FROM _dynamodb.foo WHERE id = "99" OR id = "99999";
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
DELETE FROM _dynamodb.foo WHERE id = "115" AND other = 222;
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;

INSERT IGNORE INTO _dynamodb.foo (id, other, comment) VALUES
  ("4", 4, "4 comment"),
  ("99", null, "99 comment with null"),
  ("111", 111, "111 comment"),
  ("112", 222, "112 comment"),
  ("113", 333, "113 comment"),
  ("114", null, "114 comment with null"),
  ("115", 222, "115 comment dup 222")
;
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;

DELETE FROM _dynamodb.foo WHERE other IS NULL;
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;

DELETE FROM _dynamodb.foo WHERE other = 222;
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;

DELETE FROM _dynamodb.foo WHERE comment = "111 comment";
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;

INSERT IGNORE INTO _dynamodb.foo (id, other, comment) VALUES
  ("4", 4, "4 comment"),
  ("99", null, "99 comment with null"),
  ("111", 111, "111 comment"),
  ("112", 222, "112 comment"),
  ("113", 333, "113 comment"),
  ("114", null, "114 comment with null"),
  ("115", 222, "115 comment dup 222")
;
SELECT id, other, comment FROM _dynamodb.foo ORDER BY id;
