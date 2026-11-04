# DynamoSQL Project Setup

## Overview

DynamoSQL is a MySQL-compatible query engine with DynamoDB as the storage engine. The project is an npm workspace monorepo with two packages. Package-specific guidance lives in each package's own `AGENTS.md`:

- `apps/dynamosql/AGENTS.md` for the core query engine
- `apps/server/` for the MySQL protocol server

## Project Structure

```
dynamosql/
├── apps/
│   ├── dynamosql/          # Core query engine library (see apps/dynamosql/AGENTS.md)
│   └── server/             # MySQL protocol server
├── package.json            # Root workspace configuration
└── node_modules/           # Shared dependencies
```

### Workspace Packages

1. **@dynamosql/dynamosql** (`apps/dynamosql/`): core library for MySQL query parsing and DynamoDB execution.
2. **@dynamosql/server** (`apps/server/`): MySQL protocol server. Depends on @dynamosql/dynamosql and uses mysql2 for protocol handling.

## Installation

```bash
npm install
```

This installs dependencies for the whole workspace and both packages.

## Common Commands

Run from the repo root:

```bash
# Install dependencies
npm install

# Run dynamosql package tests
npm test

# Run server package tests
npm test --workspace=apps/server

# Lint and format all workspaces
npm run lint
npm run pretty
```

Run package-specific commands from inside the package directory, as described in each package's `AGENTS.md`.

## Development Workflow

1. Make changes in `apps/dynamosql/src/` or `apps/server/src/`.
2. Lint, format, and test the package you changed. The package `AGENTS.md` lists the exact commands.

## Notes

- The project uses npm workspaces (requires npm 7+).
- The server package uses a custom fork of mysql2 from GitHub.
