# dynamosql

A MySQL compatible query engine with DynamoDB as the storage engine.
Currently useful in running queries against existing DynamoDB tables.
Future goals are to provide a performant transactional MySQL compatible
data store.

## Install

```sh
npm install dynamosql
```

## Simple Usage

This is a node.js module to provide a MySQL compatible query
syntax with a DynamoDB storage engine.

```js
const dynamosql = require('dynamosql');
const session = dynamosql.createSession();
session.query("SELECT * FROM _dynamodb.table", (err, results) => {
  if (err) {
    console.error(err);
  } else {
    console.log(results);
  }
  session.release();
});
```

Your DynamoDB tables show up in the `_dynamodb` database.

## Working Feaures

* show databases
* show tables
* select
  * simple expressions
  * joins
  * group by
  * order by
  * limit
* insert
* delete
* create table
* delete table

## Why?

After working with SQL extensively, and then using DynamoDB for
serveral projects, I missed SQL. SQL is a very expressive terse
language. Implementing feaures in user code instead of just
SQL statements makes programs bigger and more error prone.

## Why MySQL?

Having a target implementation allows test cases to compare the
results of this engine with results against MySQL.  This removes
the necessity of developing a specification and all the possible
bikeshedding involved.

## Why node-mysql?

See above.

##

## Session options

When creating a session, the following options are available.

* `database`: Name of the database to use for this connection (Optional).
* `region`: The AWS region to connect to DynamoDB.
  If not provided, will use the defaults of the AWS SDK (v3) which
  may fail. (Optional)
* `accessKeyId`: Access key for the credential object handed to the
  AWS SDK (v3). If not provided, will use the default crdential chain of
  the AWS SDK (v3). (Optional)
* `secretAccessKey`: Secret key for the credentials. (Optional)
* `resultObjects`: Determines if rows should be converted to a
  javascript object. (Default: `true`)
* `typeCast`: Determines if column values should be converted to native
  JavaScript types. (Default: `true`)
* `dateStrings`: Force date types (TIMESTAMP, DATETIME, DATE) to be returned
  as strings rather than inflated into JavaScript Date objects.
  Can be `true`/`false`. (Default: `false`)
* `multipleStatements`: Allow multiple mysql statements per query. Be careful
  with this, it could increase the scope of SQL injection attacks. (Default: `false`)

## Pooling connections

You can use pooling to set session options once and then all sessions will use
those options.

Create a pool and use it directly:

```js
const dynamosql = require('dynamosql');
const pool = dynamosql.createPool({
  database: '_dynamodb',
});

pool.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
  if (error) throw error;
  console.log('The solution is: ', results[0].solution);
});
```

Every query will use an independant session. Rollback will automatically be
preformed after the query in the case where an open transaction is still
present.

You can also pull a session out of the pool to perform a series of operations
with the same session.

```js
const dynamosql = require('dynamosql');
const pool = dynamosql.createPool(...);

pool.getSession(function(err, session) {
  if (err) throw err; // not connected!

  // Use the connection
  session.query('SELECT something FROM sometable', function (error, results, fields) {
    // When done with the connection, release it.
    session.release();

    // Handle error after the release.
    if (error) throw error;

    // Don't use the session here, it has been released.
  });
});
```

Sessions are never reused.

## Pool options

Pools accept the same options as sessions.

## Performing queries

The most basic way to perform a query is to call the `.query()` method on an object
(like a `Session`, `Pool`).  This is compatible with node-mysql.

The simplest form of `.query()` is `.query(sqlString, callback)`, where a SQL string
is the first argument and the second is a callback:

```js
session.query('SELECT * FROM `books` WHERE `author` = "David"', function (error, results, fields) {
  // error will be an Error if one occurred during the query
  // results will contain the results of the query
  // fields will contain information about the returned results fields (if any)
});
```

The second form `.query(sqlString, values, callback)` comes when using
placeholder values (see [escaping query values](#escaping-query-values)):

```js
connection.query('SELECT * FROM `books` WHERE `author` = ?', ['David'], function (error, results, fields) {
  // error will be an Error if one occurred during the query
  // results will contain the results of the query
  // fields will contain information about the returned results fields (if any)
});
```

The third form `.query(options, callback)` comes when using various advanced
options on the query, like [escaping query values](#escaping-query-values),
[joins with overlapping column names](#joins-with-overlapping-column-names),
[timeouts](#timeouts), and [type casting](#type-casting).

```js
connection.query({
  sql: 'SELECT * FROM `books` WHERE `author` = ?',
  timeout: 40000, // 40s
  values: ['David']
}, function (error, results, fields) {
  // error will be an Error if one occurred during the query
  // results will contain the results of the query
  // fields will contain information about the returned results fields (if any)
});
```

Note that a combination of the second and third forms can be used where the
placeholder values are passed as an argument and not in the options object.
The `values` argument will override the `values` in the option object.

```js
connection.query({
    sql: 'SELECT * FROM `books` WHERE `author` = ?',
    timeout: 40000, // 40s
  },
  ['David'],
  function (error, results, fields) {
    // error will be an Error if one occurred during the query
    // results will contain the results of the query
    // fields will contain information about the returned results fields (if any)
  }
);
```

## Escaping query values

Escaping is performed by the sqlstring library.  https://github.com/mysqljs/sqlstring

`escape` and `escapeId` are available on the `Pool` and `Session` objects and
on the module directly.


## Errors

This module comes with a consistent approach to error handling that you should
review carefully in order to write solid applications.

Most errors created by this module are instances of the JavaScript [Error][]
object. Additionally they typically come with two extra properties:

* `err.code`: String, contains the MySQL server error symbol if the error is
  a [MySQL server error][] (e.g. `'ER_ACCESS_DENIED_ERROR'`), a Node.js error
  code if it is a Node.js error (e.g. `'ECONNREFUSED'`), or an internal error
  code (e.g. `'PROTOCOL_CONNECTION_LOST'`).
  Should be consistent with the behavior of MySQL.
* `err.errno`: Number, contains the MySQL server error number. Is directly
  mapped from the err.code in all cases.
* `err.sql`: String, contains the full SQL of the failed query. This can be
  useful when using a higher level interface like an ORM that is generating
  the queries.
* `err.sqlMessage`: String, contains the message string that provides a
  textual description of the error. Not exactly consistent with the MySQL
  server messages, but largely equivalent.  Exact textual contents should
  not be considered a stable API.

## Type casting

For your convenience, this library can cast mysql types in results into
native JavaScript types by default. The default behavior can be changed
through various [Session options](#session-options).
The following mappings exist:

### Number

* DynamoDB Number
* DynamoDB Boolean
* TINYINT
* SMALLINT
* INT
* MEDIUMINT
* YEAR
* FLOAT
* DOUBLE
* BIGINT
* BOOL

### Date

* TIMESTAMP
* DATE
* DATETIME

### Buffer

* DynamoDB Binary
* TINYBLOB
* MEDIUMBLOB
* LONGBLOB
* BLOB
* BINARY
* VARBINARY
* BIT (last byte will be filled with 0 bits as necessary)

### String

* DynamoDB String
* DynamoDB NULL
* DynamoDB multiple types
* CHAR
* VARCHAR
* TINYTEXT
* MEDIUMTEXT
* LONGTEXT
* TEXT
* ENUM
* SET
* DECIMAL (may exceed float precision)
* TIME (could be mapped to Date, but what date would be set?)

### Object

* DynamoDB LIST
* DynamoDB MAP
* DynamoDB Sets
* JSON

## MySQL Server

You can also run this library as a MySQL compatible server and then your
choice of client to connect to it.

See `examples/server.js` for more information.

This is useful to use the standard `mysql` command line client as a REPL
for development, testing, and automation.

# Development

This library is under active development but is being used in anger on
a few projects.  Features are added as required.

## Roadmap

* update statement
* replace statement
* insert on conflict
* temporary tables (useful for subqueries)
* cross engine queries (temp & raw)
* subqueries
* more ddl statements (create index)
* expression canonicalizer
* information_schema
* mvcc columnar storage engine

## Contributing

This project welcomes contributions from the community. Contributions are
accepted using GitHub pull requests.

## Running tests

Pull the repository and run npm install from the root and from the test
subdirectory.  `setup` makes tables for the test run, then test runs over them.

Then run
```sh
cd test ; npm run setup ; npm run test
```
