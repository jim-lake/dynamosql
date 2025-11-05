import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

export default [
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/dynamosql.js',
      format: 'cjs',
      sourcemap: true,
      sourcemapExcludeSources: (source) => source.includes('src/vendor/'),
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({ declaration: false, declarationMap: false }),
    ],
    external: [
      '@aws-sdk/client-dynamodb',
      '@dynamosql/shared',
      'async',
      'big-integer',
      'sqlstring',
    ],
  },
  {
    input: 'src/index.ts',
    output: { file: 'dist/dynamosql.d.ts', format: 'es' },
    plugins: [dts()],
  },
];
