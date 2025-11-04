module.exports = {
  ignorePatterns: ['src/vendor/*'],
  env: {
    node: true,
    es6: true,
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 2022,
  },
  globals: {
    BigInt: true,
    Promise: true,
  },
  rules: {
    indent: 0,
    'linebreak-style': ['error', 'unix'],
    semi: ['error', 'always'],
    'no-console': 0,
    'no-unused-expressions': ['error', { allowShortCircuit: true }],
    'no-unused-vars': 'warn',
    'no-shadow': ['warn', { allow: ['done'] }],
  },
};
