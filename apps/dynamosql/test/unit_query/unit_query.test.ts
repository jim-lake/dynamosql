import { expect } from 'chai';
import { promisify } from 'node:util';
import { addUnitTest } from '../unit_helper';

addUnitTest('create connection', async (mod, config) => {
  const conn = mod.createConnection(config);

  expect(conn.query, 'expect query to exist').to.not.equal(null);
});
addUnitTest('simple promisify query', async (mod, config) => {
  let conn;
  try {
    conn = mod.createConnection(config);
    const result = await promisify(conn.query.bind(conn))(
      'SELECT 1 + 1 AS result'
    );
    expect(result.length, 'result.length === 1').to.equal(1);
    expect(result[0].result, 'result[0].result === 2').to.equal(2);
  } finally {
    conn.end();
  }
});
addUnitTest('simple promisify query with values', async (mod, config) => {
  let conn;
  try {
    conn = mod.createConnection(config);
    const result = await promisify(conn.query.bind(conn))(
      'SELECT 1 + ? AS result',
      [2]
    );
    expect(result.length, 'result.length === 1').to.equal(1);
    expect(result[0].result, 'result[0].result === 3').to.equal(3);
  } finally {
    conn.end();
  }
});
