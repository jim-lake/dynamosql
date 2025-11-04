import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/dynamosql.js',
    format: 'cjs',
    sourcemap: true,
    sourcemapExcludeSources: (source) => source.includes('src/vendor/'),
  },
  plugins: [resolve(), commonjs()],
  external: [
    '@aws-sdk/client-dynamodb',
    'async',
    'big-integer',
    'sqlstring',
  ],
};
