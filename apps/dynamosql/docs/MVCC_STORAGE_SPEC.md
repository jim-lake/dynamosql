# MVCC storage specification

## Transactions

1. Acquire snapshot S and create the transaction record with a fresh `tx_uuid`, a newly allocated `tx_id=T`, and `parent_tx_id=S`.
2. Write its spill payloads and all row/index records. Confirm every write and the resulting schema before commit.
3. Read current state H, M, F, and schema together. Apply the commit checks below, then atomically finalize the transaction's `parent_tx_id=H` and update state `head_tx_id=T`, `parent_tx_id=H`, `highest_committed_tx_id=MAX(M, T)`, and the resulting `schema_id`.

Commit checks:

- T already in H's committed chain means success; do not publish it again.
- The current schema must equal S's schema. DML preserves that schema; DDL publishes its prepared replacement.
- No commit after S on H's chain may have written a row or index identity that T writes.
- Reads used to prepare T must return the same base rows and values at H as at S, including missing-key lookups and predicate/range reads. Apply T's own statements in the same order when checking their read dependencies.
- T must exceed the committed TX_ID of every row or index identity it replaces, including tombstones. Validate SQL constraints against H plus T's writes.
- Publication atomically requires the observed state head and floor to be unchanged, `T>=F`, `last_alive>0`, `last_alive>=NOW()-600`, and an existing, unexpired snapshot lease.

Transactions that pass these checks may commit out of TX_ID order. A failed publication condition requires reading state again and repeating the checks. A data or schema conflict requires a new snapshot and transaction identity; explicit transactions return a conflict without replaying client-visible statements.

`tx_uuid` remains unchanged across retries. After an allocation timeout, read the attempted `tx_id`: matching UUID confirms allocation; another UUID requires a new ID. After a commit timeout, check the state's committed chain. Absence from the chain leaves the outcome unresolved while the transaction remains eligible to commit; a changed head alone does not prove failure.

Row and spill writes are immutable and retry with identical contents. Each staging request atomically conditions its writes on the validated head. Staging and commit require `tx_id>=F`. Cleanup must not race writes or publication that can still succeed. Committed parent links are immutable.

## `P__mvcc_state`

| Column | Type | Purpose |
| --- | --- | --- |
| `tx_domain` | S | Partition key |
| `head_tx_id` | N | Latest committed transaction H; not necessarily the greatest TX_ID |
| `highest_committed_tx_id` | N | Greatest TX_ID in the committed chain M |
| `parent_tx_id` | N | Previous committed head |
| `schema_id` | N | Committed schema |
| `none_uncommitted_below_tx_id` | N | Cleanup floor F; no uncommitted row/index records remain strictly below F |

Genesis values are zero; schema 0 is an empty catalog. M and F are monotonic, with `F<=M`; H may decrease. Commit changes head/parent/maximum/schema; vacuum advances F. Update only affected fields.

## `P__mvcc_transaction`

| Column | Type | Purpose |
| --- | --- | --- |
| `tx_domain` | S | Partition key |
| `tx_id` | N | Sort key |
| `tx_uuid` | S | Stable UUID for allocation retries |
| `last_alive` | N | Last writer heartbeat, Unix epoch seconds; 0 permanently fences an expired transaction |
| `parent_tx_id` | N | Validated head; finalized as the committed predecessor at publication |
| `schema_id` | N | Resulting schema |
| `payload_zstd` | B | Compressed JSON changes |

Create the record before writing table data. DML carries forward the parent's schema; DDL names its new schema. Commitment is determined exclusively by the state head and ancestor chain. Retain transaction records for ancestry and retry resolution.

Transaction and spill records are an optimization, not a correctness requirement: they let concurrent writers stage and commit non-conflicting transactions in parallel and let readers resolve in-flight work without blocking. Correctness never depends on their contents; the committed state head and ancestor chain remain authoritative. A read-only transaction never creates a transaction record; it takes a reader lease only if it chooses to protect a snapshot.

Initialize `last_alive=NOW()` and refresh it every minute while the writer is alive. An uncommitted transaction with `last_alive<NOW()-600` is dead and cannot commit. Heartbeats, staging, and publication atomically require a nonzero, unexpired `last_alive`; an expired transaction must never be revived.

Allocate `tx_id` by querying the domain's highest sort key descending with `Limit=1`, then conditionally inserting highest+1. Start at 1 when empty. On collision, refresh and retry; on timeout, resolve using `tx_uuid`. Allocation never advances the committed head. Retain records so IDs cannot be reused.

Each change records the written `pk` and `kind` (`insert`, `update`, or `delete`). `values` contains complete non-key attributes for the new row, using storage names; updates are full row images, not patches. TX_ID comes from the enclosing transaction. Deletes write the key and `DELETED=true`; index deletes also retain their identity attributes.

`previous_row_tx_id` is optional when the writer already knows the prior row's TX_ID, such as read-modify-write. It is not expected for unconditional updates or INSERTs over tombstones. Never read a prior row just to populate it; its absence changes neither visibility nor commit validation.

JSON represents native N as exact numbers, S as strings, BOOL as booleans, and NULL as null. Every B value uses `{"base64":"..."}` with padded base64, including binary keys, BLOBs, binary DOUBLEs, compressed SQL JSON, and INDEX_TX_ID. Decode the wrapper to bytes before writing. Empty B uses `{"base64":""}`; it differs from null.

`payload_zstd`, decoded (insert, read-modify-write update, delete, unconditional update):

```json
{
  "overflow": true,
  "changes": [
    {
      "kind": "insert",
      "table_id": "00000000-0000-4000-8000-000000000002",
      "dynamodb_table": "orders_00000000-0000-4000-8000-000000000002",
      "pk": {
        "id": 1
      },
      "values": {
        "name": "new order",
        "receipt": {
          "base64": "AP8="
        }
      }
    },
    {
      "kind": "update",
      "table_id": "00000000-0000-4000-8000-000000000002",
      "dynamodb_table": "orders_00000000-0000-4000-8000-000000000002",
      "pk": {
        "id": 2
      },
      "values": {
        "name": "updated order",
        "receipt": null
      },
      "previous_row_tx_id": 40
    },
    {
      "kind": "delete",
      "table_id": "00000000-0000-4000-8000-000000000002",
      "dynamodb_table": "orders_00000000-0000-4000-8000-000000000002",
      "pk": {
        "id": 3
      },
      "previous_row_tx_id": 39
    },
    {
      "kind": "update",
      "table_id": "00000000-0000-4000-8000-000000000002",
      "dynamodb_table": "orders_00000000-0000-4000-8000-000000000002",
      "pk": {
        "id": 4
      },
      "values": {
        "name": "unconditional replacement",
        "receipt": null
      }
    }
  ]
}
```

`pk` names the target partition-key attribute; index entries additionally identify INDEX_TX_ID. An empty payload is `{"overflow":false,"changes":[]}`. Read-only transactions need no record.

DDL resource intents also belong in the changes payload:

```json
{
  "overflow": false,
  "changes": [
    {
      "kind": "create_table",
      "table_id": "00000000-0000-4000-8000-000000000007",
      "dynamodb_table": "orders_00000000-0000-4000-8000-000000000007"
    },
    {
      "kind": "retire_table",
      "table_id": "00000000-0000-4000-8000-000000000002",
      "dynamodb_table": "orders_00000000-0000-4000-8000-000000000002"
    }
  ]
}
```

## `P__mvcc_tx_transaction_spill_D`

| Column | Type | Purpose |
| --- | --- | --- |
| `tx_id` | N | Partition key |
| `spill_id` | N | Sort key; stable identity for each spill item |
| `payload_zstd` | B | Compressed JSON changes |

When the transaction payload has `overflow=true`, Query every spill item for its `tx_id`. No pointers or counts. Persist each spill's intent before its referenced writes; confirm all spill writes before commit. Retry the same spill key with identical contents.

Spill payloads use the same change entries:

```json
{
  "changes": [
    {
      "kind": "insert",
      "table_id": "00000000-0000-4000-8000-000000000002",
      "dynamodb_table": "orders_00000000-0000-4000-8000-000000000002",
      "pk": {
        "id": 5
      },
      "values": {
        "name": "another order",
        "receipt": {
          "base64": ""
        }
      }
    }
  ]
}
```

## `P__mvcc_auto_increment_D`

| Column | Type | Purpose |
| --- | --- | --- |
| `table_id` | S | Partition key; physical generation UUID |
| `next_id` | N | First unreserved ID |

- Each generation has one counter, initially 1 or the declared starting value. Hidden DB_ROW_ID and declared AUTO_INCREMENT share it.
- Reserve `[A,B)` by conditionally changing `next_id=A` to B. Confirm before using IDs. Consume local ranges once; never return them after rollback or restart. Abandon ambiguous reservations.
- Pools belong to their process/domain/generation and never transfer to new generations. Hidden IDs remain stable through row updates.
- Apply MySQL generated-value and LAST_INSERT_ID rules only to declared AUTO_INCREMENT columns. Hidden IDs are positive signed BIGINTs. Declared IDs obey their column range. Step is 1.
- Explicit positive value E advances the counter to at least E+1 at commit, conditioned on the observed counter. Existing reservations remain consumed; enforce SQL uniqueness independently.
- Provision new counters before publishing new generations. Preserving rebuilds retain at least the old counter and copied generated values+1; validate the old counter at commit. TRUNCATE starts a new generation at 1; ALTER starting values must exceed retained keys.

## `P__mvcc_schema`

| Column | Type | Purpose |
| --- | --- | --- |
| `tx_domain` | S | Partition key |
| `schema_id` | N | Sort key |
| `payload_zstd` | B | Complete compressed JSON catalog |

Schemas are immutable and retained. Query the domain's highest `schema_id` descending with `Limit=1`; conditionally insert highest+1. Schema 0 is genesis. A DDL schema-ID collision requires a new attempt with a new schema ID. One catalog per item; no schema spill.

- Preserve database IDs across renames. Physical generations get fresh UUIDs and names; never republish retired generations.
- Columns have `column_name` and stable lowercase `dynamodb_name`; no numeric column IDs. New columns use a unique storage name, adding `_2`, `_3`, etc. as needed; do not reuse names within a physical generation. Rename changes `column_name` and index references, not stored attribute names. Column order defines SELECT */implicit INSERT order.
- Use normalized MySQL types, defaults, precision, charset, and collation. Irrelevant parameters are null. Fold ASCII A–Z for identifier lookup; preserve display names. Exclude temporary tables and built-in databases.
- Every key is in `indexes`: `index_name`, `unique`, and `columns` (SQL column names). PRIMARY is unique; its `dynamodb_name` selects the data partition-key attribute. With no declared PK, PRIMARY has `columns=["DB_ROW_ID"]`. Secondary indexes have `index_uuid` and `dynamodb_table`. Index encodings and direct-PK eligibility are defined in [MVCC_INDEX_ENCODING.md](MVCC_INDEX_ENCODING.md).
- Indexes use full columns and ASC order. PK columns are non-nullable. Physical key changes create new generations. Index tables use `P_table_name_index_name_${index_uuid}`; renames preserve physical names.

`payload_zstd`, decoded:

```json
{
  "tx_domain": "shop",
  "databases": [
    {
      "database_id": "00000000-0000-4000-8000-000000000001",
      "name": "shop",
      "charset": "utf8mb4",
      "collation": "utf8mb4_bin",
      "tables": [
        {
          "table_id": "00000000-0000-4000-8000-000000000002",
          "name": "orders",
          "dynamodb_table": "orders_00000000-0000-4000-8000-000000000002",
          "charset": "utf8mb4",
          "collation": "utf8mb4_bin",
          "columns": [
            {
              "column_name": "id",
              "dynamodb_name": "id",
              "mysql_type": "BIGINT",
              "nullable": false,
              "unsigned": true,
              "auto_increment": true,
              "length": null,
              "precision": 20,
              "scale": 0,
              "fsp": null,
              "charset": null,
              "collation": null,
              "default": {
                "kind": "none"
              },
              "comment": ""
            },
            {
              "column_name": "name",
              "dynamodb_name": "name",
              "mysql_type": "VARCHAR",
              "nullable": false,
              "unsigned": false,
              "auto_increment": false,
              "length": 100,
              "precision": null,
              "scale": null,
              "fsp": null,
              "charset": "utf8mb4",
              "collation": "utf8mb4_bin",
              "default": {
                "kind": "none"
              },
              "comment": ""
            },
            {
              "column_name": "receipt",
              "dynamodb_name": "receipt",
              "mysql_type": "VARBINARY",
              "nullable": true,
              "unsigned": false,
              "auto_increment": false,
              "length": 32,
              "precision": null,
              "scale": null,
              "fsp": null,
              "charset": null,
              "collation": null,
              "default": {
                "kind": "literal",
                "value": null
              },
              "comment": ""
            }
          ],
          "indexes": [
            {
              "index_name": "PRIMARY",
              "unique": true,
              "columns": [
                "id"
              ],
              "dynamodb_name": "id"
            },
            {
              "index_name": "name_unique",
              "index_uuid": "00000000-0000-4000-8000-000000000009",
              "unique": true,
              "columns": [
                "name"
              ],
              "dynamodb_table": "orders_name_unique_00000000-0000-4000-8000-000000000009"
            }
          ]
        }
      ]
    }
  ],
  "schema_id": 7
}
```

## `P_table_name_UUID`

| Column | Type | Purpose |
| --- | --- | --- |
| PRIMARY `dynamodb_name` | N/S/B | Partition key |
| `TX_ID` | N | Sort key; creating transaction |
| `DELETED?` | BOOL | True for a tombstone; absent means live |
| Column `dynamodb_name` | N/S/B/NULL | User value; lowercase attribute name |

User attributes are lowercase; system attributes are uppercase. `column_name` is the SQL name; `dynamodb_name` is the stored name. A direct PK attribute also holds its user value; do not duplicate it.

PRIMARY uses its single column's storage name when directly eligible; otherwise a synthetic attribute. A composite declared PK encodes its values in `DB_ROW_KEY` (native B). Without a declared PK, `DB_ROW_ID` (native N) is generated and excluded from user columns. The two never coexist in one table. See [primary-key encoding](MVCC_INDEX_ENCODING.md#primary-partition-key).

Live rows contain every user column. Tombstones contain only key attributes and DELETED. PK updates tombstone the old key and write the new row. Coalesce repeated writes; failed statements never enter the transaction overlay.

Point reads Query the partition key with `TX_ID<=M`, descending, until the first visible record. Scans resolve each PK at one snapshot across pages. Apply predicates/LIMIT after visibility.

## `P_table_name_index_name_${index_uuid}`

| Column | Type | Purpose |
| --- | --- | --- |
| `INDEX_PARTITION` | S | Partition key; always `ALL` |
| `INDEX_TX_ID` | B | Sort key; encoded index identity followed by TX_ID |
| `TX_ID` | N | Creating transaction; matches encoded suffix |
| `DELETED?` | BOOL | True for a tombstone; absent means live |
| Index column `dynamodb_name` | N/S/B/NULL | Indexed user value |
| PK column `dynamodb_name` | N/S/B | Target primary-key value |
| `DB_ROW_ID` | N | Target generated partition key, for a hidden PK |
| `DB_ROW_KEY` | B | Target encoded partition key, for a composite declared PK |

Each secondary index has its own table. Store overlapping index/PK attributes once. Preserve identity values on index tombstones. Column renames retain these storage names.

Nonunique entries append their PK after indexed values. Unique entries append their PK only if any indexed component is NULL. TX_ID follows the complete entry identity. [MVCC_INDEX_ENCODING.md](MVCC_INDEX_ENCODING.md) defines the bytes.

Index changes commit with row changes. Resolve entry visibility, then validate the target row at the same snapshot. Reassigning a unique non-NULL key within one transaction produces one final mapping.

## Column values

| SQL type | Stored value |
| --- | --- |
| Integer | Exact N |
| BIT | Exact N |
| DECIMAL | Exact N; scale from schema |
| FLOAT | N preserving binary32 value |
| DOUBLE | N in range; otherwise ordered binary64 in B |
| Character | Raw S |
| TEXT | Raw S |
| Binary | Raw B |
| BLOB | Raw B |
| JSON | Zstd-compressed UTF-8 JSON in B |
| DATE | N calendar epoch milliseconds at midnight |
| DATETIME | N UTC calendar epoch milliseconds |
| TIMESTAMP | N UTC epoch milliseconds |
| TIME | N signed duration milliseconds |
| YEAR | N calendar January 1 epoch milliseconds |
| SQL NULL | Native NULL |

Apply SQL coercion, defaults, range checks, and precision before storage. Preserve exact numbers and fractional milliseconds. Reject unrepresentable values except for the DOUBLE fallback below. DATETIME is always stored in UTC: interpret its SQL calendar fields as UTC, never the server's local timezone. DATE/YEAR also use proleptic Gregorian fields as UTC; TIMESTAMP applies session timezone only at SQL input/output. TIME permits hours>23, with maximum magnitude 3020399000 ms. Temporal precision is `10^(3-fsp)` milliseconds.

DOUBLE uses B if and only if its finite binary64 value is outside the [native N range](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.NamingRulesDataTypes.html). This includes nonzero underflow and overflow magnitudes; zero uses N. In-range values must use N with a decimal representation preserving binary64. NaN and infinities are invalid.

The B value is exactly the eight order-preserving IEEE binary64 bytes from [index value encoding](MVCC_INDEX_ENCODING.md#value-bytes), without a tuple marker or terminator. Writers select N/B for each value; readers inspect the returned DynamoDB attribute type for every value, never infer it for the whole column. To decode B: if its high bit is 0, complement all bits; otherwise flip the high bit. Interpret the restored bits as IEEE binary64.

PartiQL predicates must cover both native types: use numeric bounds for N and encoded binary bounds for B. Handle out-of-N-range bounds without constructing invalid N parameters. Binary bounds are passed as B parameters; mixed N/B values must not be compared as one native numeric type. Resolve MVCC visibility before mutable-value filtering.

All-zero DATE/DATETIME/TIMESTAMP/YEAR use `Z=-9000000000000000`. MySQL-permitted non-calendar DATE/DATETIME use `Z+(year*10000+month*100+day)*86400000+time_ms`; DATE time is zero. Ordinary dates use epoch milliseconds. TIME zero is 0. SQL comparisons must handle both date representations.

SQL JSON column, decoded:

```json
{
  "active": true,
  "tags": ["new", "paid"],
  "quantity": 2,
  "note": null
}
```

JSON null is compressed JSON, distinct from native SQL NULL:

```json
null
```

## Time

`NOW()` is NTP-synchronized local time in Unix epoch seconds; DynamoDB provides no server-side `NOW()` for conditions. Clients are encouraged to compare local time with HTTP response `Date` headers when creating leases or transactions. If the measured difference exceeds five seconds, abort the operation with a clock-skew error to the user.

Correctness must not depend on clock agreement. Vacuum must conditionally fence transactions and remove expired reader leases before reclaiming their records; all dependent operations check those fences. Arbitrary clock skew may cause another process to reclaim a live client's transaction or lease, preventing reads or commits from completing, but must not permit an invalid commit or result.

## `P__mvcc_reader_lease`

| Column | Type | Purpose |
| --- | --- | --- |
| `tx_domain` | S | Partition key |
| `lease_key` | S | Sort key; unique reader lease |
| `head_tx_id` | N | Protected snapshot head |
| `none_uncommitted_below_tx_id` | N | Snapshot cleanup floor |
| `expires_at` | N | Expiry/TTL seconds |

- Read H, M, F, and schema from one state snapshot. Atomically create the lease with H and F, condition-checking state head and floor are unchanged. Retry if either changed. Confirm acquisition before reads; never acquire a historical snapshot. Lease keys never repeat; renewal preserves the snapshot.
- Hold through transaction/iterator completion. Lease duration is 10 seconds; renew every second, conditioned on the lease existing and unexpired. Release deletes it. Never recreate a lost lease.
- Stop after the last confirmed deadline. Strongly read and validate the lease after dependent reads and before output/completion; snapshot-dependent commits check it atomically. A lost lease aborts the operation, even if the local clock considers it unexpired.
- Before excluding an expired lease from retention, vacuum conditionally deletes it using its observed `expires_at`. If renewal wins the race, reread the lease before proceeding. TTL deletion alone is not a cleanup barrier.
- Vacuum must preserve every unexpired lease's snapshot and all later snapshots in commit-chain order, including their required older row records.

## Visibility and cleanup

For snapshot head H, highest committed TX_ID M, and cleanup floor F:

`visible(tx_id) = tx_id<=M AND (tx_id<F OR tx_id=M OR tx_id is on H's parent chain)`.

The `tx_id<F` disjunct is unconditional because every record strictly below F is committed and retained on every chain, so no ancestry check is needed below the floor.

Select the greatest visible transaction per PK; a tombstone means absent. Overlay own successful statements. Authoritative reads are strongly consistent. Use H, M, and F from the same snapshot.

F guarantees committed records strictly below F; M identifies a committed transaction at M. When F=M, these guarantees cover every remaining record with `TX_ID<=M`: a descending point Query with `Limit=1` needs no ancestry check. Otherwise, check ancestry for candidates with `F<=TX_ID<M`.

1. In order: read current state H, M, F; read every page of the domain's reader leases; then read every transaction with `F<=tx_id<=M`. Use strongly consistent reads and H's committed chain. New readers can acquire H or a later head in commit-chain order, never an earlier head. Preserve H and all retained reader snapshots. Choose C no greater than M, any retained lease's snapshot floor, or any unresolved transaction ID still eligible to commit.
2. Fence dead transactions before deleting their row/index records: read the current head and verify absence from its committed chain, then atomically set `last_alive=0`, conditioned on the observed heartbeat and that head being unchanged. Retry if either changed. Remove their records strictly below C; a changed head alone is not proof of death.
3. Retain each key's latest record below C committed in H's chain and all records at/above C. Preserve required tombstones and every protected snapshot's visible records.
4. After exhaustive cleanup, conditionally set `none_uncommitted_below_tx_id=C` only if `none_uncommitted_below_tx_id<C`. Partial scans are not completion proof. Overlapping workers must preserve each other's protected records.

Retain transaction manifests/spills for recovery. Never reclaim an unresolved transaction still eligible to commit. Cleanup above the floor does not advance F. Committed staging retries may confirm existing contents but never recreate reclaimed records.

DDL persists data/index-table resource intents before provisioning. Copy at a protected snapshot using the DDL transaction ID and resulting schema. Complete provisioning, constraints, and counter validation before commit. Recovery cleans losing DDL; no separate job/takeover protocol.

Delete a retired data/index generation only after its retirement commits and no protected snapshot in commit-chain order still needs it. Target only recorded physical identities; never reuse names. Reconcile delayed resource operations from durable intents. Retain old counters while retained operations need them.
