import { assert } from 'chai';
import * as DynamoSQL from '../../src';
import { testNamespace } from '../test_namespace';

async function expectNoBinaryLogging(sql: string): Promise<void> {
  const conn = DynamoSQL.createConnection({ namespace: testNamespace() });
  try {
    await new Promise<void>((resolve, reject) => {
      const q = conn.query(sql, []);
      q.on('error', reject);
      q.on('end', () => resolve());
    });
    assert.fail(`expected ER_NO_BINARY_LOGGING for: ${sql}`);
  } catch (err) {
    assert.equal((err as { code?: string }).code, 'ER_NO_BINARY_LOGGING');
  } finally {
    conn.destroy();
  }
}

describe('SHOW BINARY LOGS', () => {
  it('SHOW BINARY LOGS returns ER_NO_BINARY_LOGGING', async () => {
    await expectNoBinaryLogging('SHOW BINARY LOGS');
  });
  it('SHOW MASTER LOGS returns ER_NO_BINARY_LOGGING', async () => {
    await expectNoBinaryLogging('SHOW MASTER LOGS');
  });
});
