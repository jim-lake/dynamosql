# Memory engine design gaps

## Column named DB_ROW_ID

A column named `DB_ROW_ID` is a design gap. InnoDB reserves that name for its internal row id, and MySQL rejects it with `ER_WRONG_COLUMN_NAME` in `CREATE TABLE`. The memory engine also rejects it, in both `CREATE TEMPORARY TABLE` and `ENGINE=MEMORY` tables, so the behavior does not depend on the table type.

The memory engine stores a hidden row id under the same name in tables that have no primary key. Allowing a user column with that name would collide with the hidden id.
