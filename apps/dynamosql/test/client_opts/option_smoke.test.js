const { expect } = require('chai');
const dynamosql = require('../../src/callbacks');
const { testNamespace } = require('../test_namespace');

const JSON_SQL =
  'SELECT CAST(\'{"a": 1, "b": [1, 2, "x"]}\' AS JSON) AS j_obj, ' +
  'CAST(\'[1, "two", null, true]\' AS JSON) AS j_arr';

const BIG_SQL =
  'SELECT CAST(9007199254740993 AS SIGNED) AS big_above, CAST(42 AS SIGNED) AS big_safe';

function querySession(session, sql) {
  return new Promise((resolve, reject) => {
    session.query(sql, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

describe('Client Opts smoke: JSON and bigintNative', function () {
  it('jsonStrings false returns parsed JSON values', async function () {
    const session = dynamosql.createSession({
      namespace: testNamespace(),
      resultObjects: true,
    });
    try {
      const [row] = await querySession(session, JSON_SQL);
      expect(row.j_obj).to.deep.equal({ a: 1, b: [1, 2, 'x'] });
      expect(row.j_arr).to.deep.equal([1, 'two', null, true]);
    } finally {
      session.destroy();
    }
  });

  it('jsonStrings true returns JSON text', async function () {
    const session = dynamosql.createSession({
      namespace: testNamespace(),
      resultObjects: true,
      jsonStrings: true,
    });
    try {
      const [row] = await querySession(session, JSON_SQL);
      expect(JSON.parse(row.j_obj)).to.deep.equal({ a: 1, b: [1, 2, 'x'] });
      expect(JSON.parse(row.j_arr)).to.deep.equal([1, 'two', null, true]);
    } finally {
      session.destroy();
    }
  });

  it('bigintNative returns bigint for values above 2^53', async function () {
    const session = dynamosql.createSession({
      namespace: testNamespace(),
      resultObjects: true,
      bigintNative: true,
    });
    try {
      const [row] = await querySession(session, BIG_SQL);
      expect(row.big_above).to.equal(9007199254740993n);
      expect(row.big_safe).to.equal(42n);
    } finally {
      session.destroy();
    }
  });
});
