import esbuild from 'rollup-plugin-esbuild';
import dts from 'rollup-plugin-dts';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { incVersion } from './scripts/rollup-plugin-inc-version.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default [
  {
    input: 'src/index.ts',
    output: { file: 'dist/index.js', format: 'esm', sourcemap: false },
    plugins: [
      incVersion({ pkgPath: path.join(__dirname, 'package.json') }),
      esbuild({ target: 'node24', minify: false }),
    ],
    treeshake: 'smallest',
  },
  {
    input: 'src/index.ts',
    output: [{ file: 'dist/index.d.ts', format: 'es' }],
    plugins: [dts()],
  },
];
