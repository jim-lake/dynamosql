const { createServer } = require('../src/server');
const { logger } = require('@dynamosql/dynamosql');

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
