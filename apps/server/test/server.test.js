const { expect } = require('chai');
const { createServer } = require('../src/server');

describe('Server', () => {
  let server;

  afterEach(() => {
    if (server?._server) {
      server._server.close();
    }
  });

  it('should create server instance', () => {
    server = createServer({ multipleStatements: true });
    expect(server).to.exist;
  });

  it('should listen on port', (done) => {
    server = createServer({ multipleStatements: true });
    const port = 13306;
    server.listen(port, (err) => {
      expect(err).to.not.exist;
      done();
    });
  });
});
