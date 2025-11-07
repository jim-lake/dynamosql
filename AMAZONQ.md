# DynamoSQL Project Setup

## Overview

DynamoSQL is a MySQL-compatible query engine with DynamoDB as the storage engine. The project is structured as an npm workspace monorepo with two main packages.

## Project Structure

```
dynamosql/
├── apps/
│   ├── dynamosql/          # Core query engine library
│   └── server/             # MySQL protocol server
├── config.json             # MySQL connection config for tests
├── package.json            # Root workspace configuration
└── node_modules/           # Shared dependencies
```

### Workspace Packages

1. **@dynamosql/dynamosql** (`apps/dynamosql/`)
   - Core library providing MySQL query parsing and DynamoDB execution
   - Main entry: `src/index.js`
   - Dependencies: AWS SDK v3, async, big-integer, sqlstring

2. **@dynamosql/server** (`apps/server/`)
   - MySQL protocol server implementation
   - Depends on @dynamosql/dynamosql
   - Uses mysql2 for protocol handling

## Installation

```bash
npm install
```

This installs all dependencies for the workspace and both packages.

## Configuration

### Test Configuration (`config.json`)

```json
{
  "db": {
    "host": "localhost",
    "database": "dynamodb_test",
    "user": "root",
    "password": ""
  }
}
```

This configures the MySQL connection used for test comparison (tests run queries against both MySQL and DynamoDB to verify compatibility).

### AWS Configuration

The library uses AWS SDK v3 default credential chain. Set environment variables:

```bash
export AWS_REGION=us-west-2
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
```

Or use AWS profiles in `~/.aws/credentials`.

## Running Tests

**IMPORTANT: Never use grep, head, tail, or other output filtering when running tests. These commands hide failures and make it impossible to see what actually happened. Use `npm run test:quiet` if you want to suppress verbose output while still seeing test results.**

### Setup Test Tables

Before running tests, create the required DynamoDB tables:

```bash
cd apps/dynamosql
npm run test:setup
```

This runs `test/setup/setup.js` which creates tables in both MySQL and DynamoDB.

### Run All Tests

From the root:

```bash
npm test
```

This runs tests for the dynamosql package only (as configured in root package.json).

### Run Single Test File

```bash
cd apps/dynamosql
npm run test:single -- test/unit_query/unit_query.test.ts
```

### Run Tests for Specific Package

```bash
# DynamoDB query engine tests
npm test --workspace=apps/dynamosql

# Server tests
npm test --workspace=apps/server
```

### Test Structure

Tests are organized by feature in `apps/dynamosql/test/`:

- `setup/` - Table creation scripts
- `select/` - SELECT query tests
- `insert/` - INSERT query tests
- `update/` - UPDATE query tests
- `delete/` - DELETE query tests
- `replace/` - REPLACE query tests
- `join/` - JOIN query tests
- `expression/` - Expression evaluation tests
- `ddl/` - DDL statement tests
- `memory/` - In-memory table tests
- `client_opts/` - Client option tests

Each test directory contains:

- `.sql` files with test queries
- `.test.js` files that run queries against both MySQL and DynamoDB and compare results

### Test Helpers

- `test_client.js` - MySQL client setup
- `test_session.js` - DynamoDB session setup
- `test_sql_helper.js` - SQL test utilities
- `query.js` - Query execution helpers
- `proxy.js` - TCP proxy for debugging
- `dynamo.js` - DynamoDB utilities

## Code Quality

### Linting

```bash
# Lint all workspaces
npm run lint

# Lint specific package
npm run lint --workspace=apps/dynamosql
```

ESLint configuration (`.eslintrc.js`):

- ES6/ES2022 syntax
- Node.js environment
- Extends eslint:recommended
- Unix line endings enforced

### Formatting

```bash
# Format all workspaces
npm run pretty

# Format specific package
npm run pretty --workspace=apps/dynamosql
```

Prettier configuration (`.prettierrc`):

- Single quotes
- 2-space tabs
- ES5 trailing commas

## Development Workflow

1. **Make changes** to source code in `apps/dynamosql/src/` or `apps/server/src/`

2. **Run linter**:

   ```bash
   npm run lint
   ```

3. **Format code**:

   ```bash
   npm run pretty
   ```

4. **Run tests**:
   ```bash
   npm run test:setup --workspace=apps/dynamosql  # If tables changed
   npm test
   ```

## Key Dependencies

### Production

- `@aws-sdk/client-dynamodb` - AWS DynamoDB client
- `async` - Async control flow
- `big-integer` - Large number handling
- `sqlstring` - SQL string escaping
- `mysql2` - MySQL protocol (server only)

### Development

- `mocha` - Test framework
- `chai` - Assertion library
- `mysql` - MySQL client for test comparison
- `eslint` - Linting
- `prettier` - Code formatting

## Test Requirements

Tests require:

1. **MySQL server** running locally (configured in `config.json`)
2. **AWS credentials** with DynamoDB access
3. **DynamoDB tables** created via `npm run test:setup`

The test suite compares query results between MySQL and DynamoDB to ensure compatibility.

## Common Commands

```bash
# Install dependencies
npm install

# Setup test tables
npm run test:setup --workspace=apps/dynamosql

# Run all tests (verbose)
npm test

# Run tests with minimal output
npm run test:quiet --workspace=apps/dynamosql

# Lint code
npm run lint

# Format code
npm run pretty

# Run tests for specific package
npm test --workspace=apps/dynamosql
npm test --workspace=apps/server
```

## Notes

- The project uses npm workspaces (requires npm 7+)
- Tests timeout at 15 seconds by default
- The server package uses a custom fork of mysql2 from GitHub
- DynamoDB tables appear in the `_dynamodb` database namespace
