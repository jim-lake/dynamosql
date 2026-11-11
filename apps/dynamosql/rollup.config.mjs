import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import esbuild from 'rollup-plugin-esbuild';
import dts from 'rollup-plugin-dts';
import path from 'node:path';

function isExternal(id) {
  return (
    ['@aws-sdk/client-dynamodb', 'big-integer', 'sqlstring'].includes(id) ||
    id.startsWith('node:')
  );
}

function srcAlias() {
  return {
    name: 'src-alias',
    resolveId(source, importer) {
      if (!source.startsWith('@/')) {
        return null;
      }
      const target = path.resolve('src', source.slice(2));
      return this.resolve(target, importer, { skipSelf: true });
    },
  };
}

export default [
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/dynamosql.js',
      format: 'cjs',
      sourcemap: true,
      sourcemapExcludeSources: true,
    },
    plugins: [
      srcAlias(),
      resolve({
        preferBuiltins: true,
        extensions: ['.ts', '.mjs', '.js', '.json', '.node'],
      }),
      commonjs(),
      esbuild({ target: 'es2022', tsconfig: 'tsconfig.json' }),
    ],
    external: isExternal,
  },
  {
    input: 'src/index.ts',
    output: { file: 'dist/dynamosql.d.ts', format: 'es' },
    plugins: [srcAlias(), dts()],
    external: isExternal,
  },
];
