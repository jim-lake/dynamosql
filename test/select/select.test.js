const { runTests } = require('../test_sql_helper');
const path = require('node:path');

runTests(path.join(__dirname, 'select.sql'));
