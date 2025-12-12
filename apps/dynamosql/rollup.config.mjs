import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

function isExternal(id) {
  return (
    [
      '@aws-sdk/client-dynamodb',
      '@dynamosql/shared',
      'big-integer',
      'sqlstring',
    ].includes(id) || id.startsWith('node:')
  );
}

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
      resolve({ preferBuiltins: true }),
      commonjs(),
      typescript({ declaration: false, declarationMap: false }),
    ],
    external: isExternal,
  },
  {
    input: 'src/index.ts',
    output: { file: 'dist/dynamosql.d.ts', format: 'es' },
    plugins: [dts()],
    external: isExternal,
  },
];
