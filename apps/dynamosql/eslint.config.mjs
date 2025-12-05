import js from '@eslint/js';
import tseslint from 'typescript-eslint';

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
    rules: {
      'no-console': 'error',
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
