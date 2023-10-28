# dynamosql

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
session.query("SELECT id FROM _dynamodb.table", (err, results) => {
  if (err) {
    console.error(err);
  } else {
    console.log(results);
  }
  session.release();
});
```

## Working Feaures

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

## Coming Soon

* update

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

