import { expect } from 'chai';
import { promisify } from 'node:util';
import { addUnitTest } from '../unit_helper';

addUnitTest('create connection', async (mod, config) => {
  const conn = mod.createConnection(config);
  expect(conn.query).to.not.equal(null);
  conn.destroy();
});

addUnitTest('empty query', async (mod, config) => {
  const conn = mod.createConnection(config);
  let err;
  try {
    await promisify(conn.query.bind(conn))('', []);
  } catch (e) {
    err = e;
  } finally {
    conn.destroy();
  }
  expect(err, 'should throw on empty query').to.not.be.undefined;
});

addUnitTest('empty query object', async (mod, config) => {
  const conn = mod.createConnection(config);
  try {
    const q = conn.query('', []);
    expect(q).to.not.be.undefined;
  } finally {
    conn.destroy();
  }
});

addUnitTest('empty query object start', async (mod, config) => {
  const conn = mod.createConnection(config);
  let err;
  const q = conn.query('', []);
  expect(q, 'on should be an object').to.not.be.undefined;
  expect(q.on, 'on should be a function').to.not.be.undefined;
  expect(q.start, 'on should be a function').to.not.be.undefined;

  try {
    await new Promise<void>((resolve, reject) => {
      q.on('error', (err) => {
        console.log('error:', err);
        reject(err);
      });
      q.on('end', () => {
        console.log('end');
        resolve();
      });
      //q.start();
    });
  } catch (e) {
    console.log('err:', e);
    err = e;
  } finally {
    conn.destroy();
  }
  expect(err, 'should throw on empty query after start').to.not.be.undefined;
});

addUnitTest('simple query', async (mod, config) => {
  const conn = mod.createConnection(config);
  try {
    const result = await promisify(conn.query.bind(conn))(
      'SELECT 1 + 1 AS result'
    );
    expect(result.length).to.equal(1);
    expect(result[0].result).to.equal(2);
  } finally {
    conn.destroy();
  }
});

addUnitTest('query with values', async (mod, config) => {
  const conn = mod.createConnection(config);
  try {
    const result = await promisify(conn.query.bind(conn))(
      'SELECT 1 + ? AS result',
      [2]
    );
    expect(result.length).to.equal(1);
    expect(result[0].result).to.equal(3);
  } finally {
    conn.destroy();
  }
});

addUnitTest('query with options object', async (mod, config) => {
  const conn = mod.createConnection(config);
  try {
    const result = await promisify(conn.query.bind(conn))({
      sql: 'SELECT ? AS value',
      values: [42],
    });
    expect(result[0].value).to.equal(42);
  } finally {
    conn.destroy();
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
    conn.destroy();
  }
});

addUnitTest('connection escapeId', async (mod, config) => {
  const conn = mod.createConnection(config);
  try {
    const escaped = conn.escapeId('column');
    expect(escaped).to.include('`');
  } finally {
    conn.destroy();
  }
});

addUnitTest('connection format', async (mod, config) => {
  const conn = mod.createConnection(config);
  try {
    const formatted = conn.format('SELECT ? AS value', [456]);
    expect(formatted).to.include('456');
  } finally {
    conn.destroy();
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
    conn.destroy();
  }
});

addUnitTest('connection threadId', async (mod, config) => {
  const conn = mod.createConnection(config);
  try {
    expect(conn.threadId).to.not.be.undefined;
  } finally {
    conn.destroy();
  }
});

addUnitTest('connection destroy', async (mod, config) => {
  const conn = mod.createConnection(config);
  conn.destroy();
});
