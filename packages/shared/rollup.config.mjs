import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

function isExternal(id) {
  return id.startsWith('node:');
}

export default [
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
      sourcemapExcludeSources: true,
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
    output: { file: 'dist/index.d.ts', format: 'es' },
    plugins: [dts()],
    external: isExternal,
  },
];
