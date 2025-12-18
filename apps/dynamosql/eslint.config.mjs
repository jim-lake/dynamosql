import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import { plugin as localPlugin } from '@dynamosql/lint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        global: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
      },
    },
    plugins: { local: localPlugin, import: importPlugin },
    rules: {
      'no-console': 'error',
      'local/local-snake-case': [
        0,
        { exclude: [/^affectedRows$/, /^changedRows$/] },
      ],
      '@typescript-eslint/prefer-as-const': 'error',
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-require-imports': 'error',
      'no-unused-vars': 0,
      curly: ['error', 'all'],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ImportExpression',
          message: 'Dynamic import() is not allowed.',
        },
        {
          selector: 'TSImportType',
          message:
            'Type import() syntax is not allowed — use an explicit import type instead.',
        },
        {
          selector:
            "ConditionalExpression[test.operator='==='][test.left.operator='typeof'][test.right.value='number'][consequent.type='Identifier'][alternate.type='CallExpression'][alternate.callee.name='Number']",
          message:
            "Avoid `typeof x === 'number' ? x : Number(x)` — just use Number(x).",
        },
        {
          selector:
            "ConditionalExpression[test.operator='==='][test.left.operator='typeof'][test.right.value='string'][consequent.type='Identifier'][alternate.type='CallExpression'][alternate.callee.name='String']",
          message:
            "Avoid `typeof x === 'string' ? x : String(x)` — just use String(x).",
        },
        {
          selector:
            "ConditionalExpression[test.operator='==='][test.left.operator='typeof'][test.right.value='bigint'][consequent.type='Identifier'][alternate.type='CallExpression'][alternate.callee.name='BigInt']",
          message:
            "Avoid `typeof x === 'bigint' ? x : BigInt(x)` — just use BigInt(x).",
        },
      ],
    },
  },
  {
    files: ['src/**/*.ts'],
    extends: [
      ...tseslint.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylistic,
    ],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.eslint.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          disallowTypeAnnotations: true,
          fixStyle: 'separate-type-imports',
        },
      ],
      'no-duplicate-imports': ['error', { allowSeparateTypeImports: true }],
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            //'object',
            'unknown',
            'type',
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/only-throw-error': 0,
      '@typescript-eslint/no-base-to-string': 0,
      '@typescript-eslint/restrict-plus-operands': 0,
      '@typescript-eslint/restrict-template-expressions': 0,
      '@typescript-eslint/require-await': 0,
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/no-empty-function': 0,
      '@typescript-eslint/no-unnecessary-type-conversion': 0,
      '@typescript-eslint/no-unnecessary-type-parameters': 0,
      '@typescript-eslint/no-unsafe-assignment': 0,
      '@typescript-eslint/no-unsafe-member-access': 0,
      '@typescript-eslint/no-unsafe-argument': 0,
    },
  },
  {
    files: ['test/**/*.js', 'test/**/*.ts'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        before: 'readonly',
        beforeEach: 'readonly',
        after: 'readonly',
        afterEach: 'readonly',
      },
    },
    linterOptions: { reportUnusedDisableDirectives: 'warn' },
    rules: {
      '@typescript-eslint/naming-convention': 0,
      '@typescript-eslint/no-shadow': ['error', { allow: ['err'] }],
      '@typescript-eslint/no-explicit-any': 0,
      'no-console': 0,
      '@typescript-eslint/no-unused-expressions': 0,
      '@typescript-eslint/no-require-imports': 0,
    },
  },
  {
    files: ['examples/**/*.js'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        before: 'readonly',
        beforeEach: 'readonly',
        after: 'readonly',
        afterEach: 'readonly',
      },
    },
    linterOptions: { reportUnusedDisableDirectives: 'warn' },
    rules: { 'no-console': 0, '@typescript-eslint/no-require-imports': 0 },
  },
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '*.config.js',
      '*.config.mjs',
      'src/vendor/**',
    ],
  }
);
