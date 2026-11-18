import { assert } from 'chai';
import * as DynamoSQL from '../../src';
import { testNamespace } from '../test_namespace';

describe('SHOW BINARY LOG STATUS', () => {
  it('SHOW BINARY LOG STATUS returns ER_NO_BINARY_LOGGING', async () => {
    const conn = DynamoSQL.createConnection({ namespace: testNamespace() });
    try {
      await new Promise<void>((resolve, reject) => {
        const q = conn.query('SHOW BINARY LOG STATUS', []);
        q.on('error', reject);
        q.on('end', () => resolve());
      });
      assert.fail('expected ER_NO_BINARY_LOGGING');
    } catch (err) {
      assert.equal((err as { code?: string }).code, 'ER_NO_BINARY_LOGGING');
    } finally {
      conn.destroy();
    }
  });
});
