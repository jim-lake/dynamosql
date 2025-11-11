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
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-require-imports': 'error',
      'no-unused-vars': 0,
      curly: ['error', 'all'],
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
    rules: { '@typescript-eslint/no-require-imports': 0 },
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
