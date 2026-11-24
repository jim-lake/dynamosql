const { expect } = require('chai');
const dynamosql = require('../../src/callbacks');
const promise = require('../../src');
const { testNamespace } = require('../test_namespace');

const SQL = "SELECT 1+1 AS two, 'abc' AS s";

function callbackQuery(conn, sql) {
  return new Promise((resolve, reject) => {
    conn.query(sql, (err, rows, fields) =>
      err ? reject(err) : resolve([rows, fields])
    );
  });
}

describe('Promise API', function () {
  it('createConnection query returns [rows, fields]', async function () {
    const conn = await promise.createConnection({ namespace: testNamespace() });
    try {
      const [rows, fields] = await conn.query(SQL);
      expect(rows[0].two).to.equal(2);
      expect(rows[0].s).to.equal('abc');
      expect(fields.map((f) => f.name)).to.deep.equal(['two', 's']);
    } finally {
      conn.destroy();
    }
  });
  it('pool getConnection and release', async function () {
    const pool = promise.createPool({ namespace: testNamespace() });
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(SQL);
      expect(rows[0].two).to.equal(2);
    } finally {
      conn.release();
    }
    await pool.end();
  });
  it('end resolves', async function () {
    const conn = await promise.createConnection({ namespace: testNamespace() });
    await conn.end();
  });
  it('invalid query rejects with error fields', async function () {
    const conn = await promise.createConnection({ namespace: testNamespace() });
    try {
      let err;
      try {
        await conn.query('SELECT * FROM no_such_table_for_promise_test');
      } catch (e) {
        err = e;
      }
      expect(err).to.be.an('error');
      expect(err.code).to.be.a('string');
      expect(err.errno).to.be.a('number');
      expect(err).to.have.property('sqlState');
    } finally {
      conn.destroy();
    }
  });
  it('DML returns ResultSetHeader', async function () {
    const conn = await promise.createConnection({ namespace: testNamespace() });
    try {
      await conn.query('CREATE DATABASE IF NOT EXISTS promise_api_db');
      await conn.query('USE promise_api_db');
      await conn.query(
        'CREATE TEMPORARY TABLE promise_api_dml (id INT PRIMARY KEY, v INT)'
      );
      const [header] = await conn.query(
        'INSERT INTO promise_api_dml (id, v) VALUES (1, 1), (2, 2)'
      );
      expect(header.affectedRows).to.equal(2);
      expect(header.insertId).to.be.a('number');
      expect(header.fieldCount).to.equal(0);
      expect(header.info).to.be.a('string');
      const [update] = await conn.query(
        'UPDATE promise_api_dml SET v = 2 WHERE id IN (1, 2)'
      );
      expect(update.affectedRows).to.equal(2);
      expect(update.changedRows).to.equal(1);
    } finally {
      conn.destroy();
    }
  });
  it('callback API returns identical rows and fields', async function () {
    const cb_conn = dynamosql.createConnection({ namespace: testNamespace() });
    const p_conn = await promise.createConnection({
      namespace: testNamespace(),
    });
    try {
      const [cb_rows, cb_fields] = await callbackQuery(cb_conn, SQL);
      const [p_rows, p_fields] = await p_conn.query(SQL);
      expect(cb_rows).to.deep.equal(p_rows);
      expect(cb_fields).to.deep.equal(p_fields);
    } finally {
      cb_conn.destroy();
      p_conn.destroy();
    }
  });
});
