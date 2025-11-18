import { expect } from 'chai';
import { promisify } from 'node:util';
import { addUnitTest } from '../unit_helper';

addUnitTest('SHOW DATABASES', async (mod, config) => {
  const conn = mod.createConnection(config);
  try {
    const result = await promisify(conn.query.bind(conn))('SHOW DATABASES');
    expect(result).to.be.an('array');
    expect(result.length).to.be.greaterThan(0);
  } finally {
    conn.destroy();
  }
});

addUnitTest('SHOW unsupported command', async (mod, config) => {
  const conn = mod.createConnection(config);
  let err;
  try {
    await promisify(conn.query.bind(conn))('SHOW COLUMNS FROM test');
  } catch (e) {
    err = e;
  } finally {
    conn.destroy();
  }
  expect(err, 'should throw on unsupported SHOW command').to.not.be.undefined;
});
