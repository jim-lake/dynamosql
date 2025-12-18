import { logger } from '@dynamosql/shared';
import { expect } from 'chai';
import { promisify } from 'node:util';
import { addUnitTest } from '../unit_helper';

describe('Unit tests for query interface', async (t) => {
  await addUnitTest(t, 'create connection', async (mod, config) => {
    const conn = mod.createConnection(config);
    expect(conn.query).to.not.equal(null);
    conn.destroy();
  });
  await addUnitTest(t, 'empty query', async (mod, config) => {
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
  await addUnitTest(t, 'empty query object', async (mod, config) => {
    const conn = mod.createConnection(config);
    try {
      const q = conn.query('', []);
      expect(q, 'on should be an object').to.not.be.undefined;
      expect(q.on, 'on should be a function').to.not.be.undefined;
      expect(q.start, 'on should be a function').to.not.be.undefined;
    } finally {
      conn.destroy();
    }
  });
  await addUnitTest(t, 'empty query object start', async (mod, config) => {
    const conn = mod.createConnection(config);
    let err;
    try {
      const q = conn.query('', []);
      await new Promise<void>((resolve, reject) => {
        q.on('error', (err) => {
          logger.trace('error:', err);
          reject(err);
        });
        q.on('end', (data) => {
          logger.trace('end:', data);
          resolve();
        });
      });
    } catch (e) {
      logger.trace('err:', e);
      err = e;
    } finally {
      conn.destroy();
    }
    expect(err, 'should throw on empty query after start').to.not.be.undefined;
  });
  await addUnitTest(t, 'error should still call end', async (mod, config) => {
    const conn = mod.createConnection(config);
    let err;
    try {
      const q = conn.query('', []);
      await new Promise<void>((resolve, reject) => {
        q.on('error', (error) => {
          logger.trace('on.error:', error);
          err = error;
        });
        q.on('end', (data) => {
          logger.trace('on.end:', data);
          resolve();
        });
      });
    } catch (e) {
      logger.trace('threw:', e);
    } finally {
      conn.destroy();
    }
    expect(err, 'should throw on empty query after start').to.not.be.undefined;
  });
  await addUnitTest(t, 'query events work', async (mod, config) => {
    const conn = mod.createConnection(config);
    let fields;
    const rows = [];
    try {
      await new Promise<void>((resolve, reject) => {
        const q = conn.query('SELECT 1 + 1 AS result', []);
        q.on('fields', (data) => {
          logger.trace('fields:', data);
          fields = data;
        });
        q.on('result', (row) => {
          logger.trace('result:', row);
          rows.push(row);
        });
        q.on('error', (err) => {
          logger.trace('error:', err);
          reject(err);
        });
        q.on('end', () => {
          logger.trace('end');
          resolve();
        });
      });
    } finally {
      conn.destroy();
    }
    expect(fields.length, 'fields should be an array').to.equal(1);
    expect(rows.length, 'rows should have 1 item').to.equal(1);
  });
  await addUnitTest(t, 'simple query', async (mod, config) => {
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
  await addUnitTest(t, 'query with values', async (mod, config) => {
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
  await addUnitTest(t, 'query with options object', async (mod, config) => {
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
  await addUnitTest(t, 'pool query', async (mod, config) => {
    const pool = mod.createPool(config);
    try {
      const result = await promisify(pool.query.bind(pool))(
        'SELECT 1 AS value'
      );
      expect(result[0].value).to.equal(1);
    } finally {
      pool.end();
    }
  });
  await addUnitTest(t, 'pool getConnection', async (mod, config) => {
    const pool = mod.createPool(config);
    try {
      const conn = await promisify(pool.getConnection.bind(pool))();
      const result = await promisify(conn.query.bind(conn))(
        'SELECT 2 AS value'
      );
      expect(result[0].value).to.equal(2);
      conn.release();
    } finally {
      pool.end();
    }
  });
  await addUnitTest(t, 'escape function', async (mod) => {
    const escaped = mod.escape("test'value");
    expect(escaped).to.include("'test\\'value'");
  });
  await addUnitTest(t, 'escapeId function', async (mod) => {
    const escaped = mod.escapeId('table.column');
    expect(escaped).to.include('`');
  });
  await addUnitTest(t, 'format function', async (mod) => {
    const formatted = mod.format('SELECT ? AS value', [123]);
    expect(formatted).to.include('123');
  });
  await addUnitTest(t, 'connection escape', async (mod, config) => {
    const conn = mod.createConnection(config);
    try {
      const escaped = conn.escape("test'value");
      expect(escaped).to.include("'test\\'value'");
    } finally {
      conn.destroy();
    }
  });
  await addUnitTest(t, 'connection escapeId', async (mod, config) => {
    const conn = mod.createConnection(config);
    try {
      const escaped = conn.escapeId('column');
      expect(escaped).to.include('`');
    } finally {
      conn.destroy();
    }
  });
  await addUnitTest(t, 'connection format', async (mod, config) => {
    const conn = mod.createConnection(config);
    try {
      const formatted = conn.format('SELECT ? AS value', [456]);
      expect(formatted).to.include('456');
    } finally {
      conn.destroy();
    }
  });
  await addUnitTest(t, 'pool escape', async (mod, config) => {
    const pool = mod.createPool(config);
    try {
      const escaped = pool.escape("test'value");
      expect(escaped).to.include("'test\\'value'");
    } finally {
      pool.end();
    }
  });
  await addUnitTest(t, 'pool escapeId', async (mod, config) => {
    const pool = mod.createPool(config);
    try {
      const escaped = pool.escapeId('column');
      expect(escaped).to.include('`');
    } finally {
      pool.end();
    }
  });
  await addUnitTest(t, 'connection state', async (mod, config) => {
    const conn = mod.createConnection(config);
    try {
      expect(conn.state).to.be.a('string');
    } finally {
      conn.destroy();
    }
  });
  await addUnitTest(t, 'connection threadId', async (mod, config) => {
    const conn = mod.createConnection(config);
    try {
      expect(conn.threadId).to.not.be.undefined;
    } finally {
      conn.destroy();
    }
  });
  await addUnitTest(t, 'connection destroy', async (mod, config) => {
    const conn = mod.createConnection(config);
    conn.destroy();
  });
});
