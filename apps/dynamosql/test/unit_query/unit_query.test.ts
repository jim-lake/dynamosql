import { expect } from 'chai';
import { promisify } from 'node:util';
import { addUnitTest } from '../unit_helper';

addUnitTest('create connection', async (mod, config) => {
  const conn = mod.createConnection(config);
  expect(conn.query).to.not.equal(null);
  conn.end();
});

addUnitTest('simple query', async (mod, config) => {
  const conn = mod.createConnection(config);
  try {
    const result = await promisify(conn.query.bind(conn))('SELECT 1 + 1 AS result');
    expect(result.length).to.equal(1);
    expect(result[0].result).to.equal(2);
  } finally {
    conn.end();
  }
});

addUnitTest('query with values', async (mod, config) => {
  const conn = mod.createConnection(config);
  try {
    const result = await promisify(conn.query.bind(conn))('SELECT 1 + ? AS result', [2]);
    expect(result.length).to.equal(1);
    expect(result[0].result).to.equal(3);
  } finally {
    conn.end();
  }
});

addUnitTest('query with options object', async (mod, config) => {
  const conn = mod.createConnection(config);
  try {
    const result = await promisify(conn.query.bind(conn))({ sql: 'SELECT ? AS value', values: [42] });
    expect(result[0].value).to.equal(42);
  } finally {
    conn.end();
  }
});

addUnitTest('pool query', async (mod, config) => {
  const pool = mod.createPool(config);
  try {
    const result = await promisify(pool.query.bind(pool))('SELECT 1 AS value');
    expect(result[0].value).to.equal(1);
  } finally {
    pool.end();
  }
});

addUnitTest('pool getConnection', async (mod, config) => {
  const pool = mod.createPool(config);
  try {
    const conn = await promisify(pool.getConnection.bind(pool))();
    const result = await promisify(conn.query.bind(conn))('SELECT 2 AS value');
    expect(result[0].value).to.equal(2);
    conn.release();
  } finally {
    pool.end();
  }
});

addUnitTest('escape function', async (mod) => {
  const escaped = mod.escape("test'value");
  expect(escaped).to.include("'test\\'value'");
});

addUnitTest('escapeId function', async (mod) => {
  const escaped = mod.escapeId('table.column');
  expect(escaped).to.include('`');
});

addUnitTest('format function', async (mod) => {
  const formatted = mod.format('SELECT ? AS value', [123]);
  expect(formatted).to.include('123');
});

addUnitTest('connection escape', async (mod, config) => {
  const conn = mod.createConnection(config);
  try {
    const escaped = conn.escape("test'value");
    expect(escaped).to.include("'test\\'value'");
  } finally {
    conn.end();
  }
});

addUnitTest('connection escapeId', async (mod, config) => {
  const conn = mod.createConnection(config);
  try {
    const escaped = conn.escapeId('column');
    expect(escaped).to.include('`');
  } finally {
    conn.end();
  }
});

addUnitTest('connection format', async (mod, config) => {
  const conn = mod.createConnection(config);
  try {
    const formatted = conn.format('SELECT ? AS value', [456]);
    expect(formatted).to.include('456');
  } finally {
    conn.end();
  }
});

addUnitTest('pool escape', async (mod, config) => {
  const pool = mod.createPool(config);
  try {
    const escaped = pool.escape("test'value");
    expect(escaped).to.include("'test\\'value'");
  } finally {
    pool.end();
  }
});

addUnitTest('pool escapeId', async (mod, config) => {
  const pool = mod.createPool(config);
  try {
    const escaped = pool.escapeId('column');
    expect(escaped).to.include('`');
  } finally {
    pool.end();
  }
});

addUnitTest('connection state', async (mod, config) => {
  const conn = mod.createConnection(config);
  try {
    expect(conn.state).to.be.a('string');
  } finally {
    conn.end();
  }
});

addUnitTest('connection threadId', async (mod, config) => {
  const conn = mod.createConnection(config);
  try {
    expect(conn.threadId).to.not.be.undefined;
  } finally {
    conn.end();
  }
});

addUnitTest('connection destroy', async (mod, config) => {
  const conn = mod.createConnection(config);
  conn.destroy();
});
