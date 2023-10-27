const { createServer } = require('../server/server');
const { logger } = require('../src');

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3306;

const server = createServer({ multipleStatements: true });
server.listen(PORT, (err) => {
  if (err) {
    logger.debug('dynamosql init failed:', err);
    process.exit(-1);
  } else {
    logger.info('dynamosql server listening:', PORT);
  }
});
