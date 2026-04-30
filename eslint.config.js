// ESLint flat config (ESLint 10+).
// Enforces the cross-cutting rules from architecture.md §Implementation Patterns → Enforcement.
// Per-package overrides (React rules for client, Node-specific rules for server) land in
// stories 1.2 and 1.3 respectively.

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import importX from 'eslint-plugin-import-x';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

export default [
  // Global ignores
  {
    ignores: [
      'node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '**/*.tsbuildinfo',
      'pnpm-lock.yaml',
    ],
  },

  // ESLint recommended baseline (applies to .js as well as .ts/.tsx)
  js.configs.recommended,

  // typescript-eslint recommended (TypeScript + flat-config aware)
  ...tseslint.configs.recommended,

  // Project-wide rules — apply to everything we author under apps/ and packages/
  {
    files: ['apps/**/*.{ts,tsx,js,jsx}', 'packages/**/*.{ts,tsx,js,jsx}'],
    plugins: {
      'import-x': importX,
    },
    rules: {
      // No console.* anywhere — server uses pino, client uses api-client.ts only.
      // Per-package overrides in stories 1.2 / 1.3 will allow `console.error` for client api-client.
      'no-console': 'error',

      // Allow underscore-prefixed unused params (Express ErrorRequestHandler
      // requires 4-arity even when next isn't used; ditto for other middleware
      // signatures that mandate a position the body doesn't read).
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // No relative imports beyond one level — use path aliases (@app, @server, @shared).
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '^(\\.\\./){2,}',
              message:
                'Use path aliases (@app/*, @server/*, @shared/*) instead of deep relative imports.',
            },
          ],
        },
      ],

      // No `.then()` chains — prefer async/await throughout.
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[property.name='then']",
          message: 'Use async/await instead of .then() chains.',
        },
      ],

      // Catch missed `await`s on promises returned by async functions.
      '@typescript-eslint/no-floating-promises': 'error',

      // Consistent import grouping.
      'import-x/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          pathGroups: [
            { pattern: '@app/**', group: 'internal' },
            { pattern: '@server/**', group: 'internal' },
            { pattern: '@shared/**', group: 'internal' },
            { pattern: '@todo-app/**', group: 'internal' },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        // Use type-aware linting once apps exist (stories 1.2 / 1.3 will set `project: true`).
        // No source files yet, so leaving project off here keeps lint fast and avoids false negatives.
        ecmaVersion: 2023,
        sourceType: 'module',
      },
    },
    settings: {
      'import-x/resolver': {
        // The `typescript` resolver picks up `paths` from tsconfig.base.json so import-x
        // recognises `@app/*`, `@server/*`, `@shared/*` aliases. Will be exercised once
        // source files exist in stories 1.2+.
        typescript: {
          alwaysTryTypes: true,
          project: ['./tsconfig.base.json'],
        },
      },
    },
  },

  // Config files don't have type-aware linting — disable rules that require it
  {
    files: ['**/*.config.{ts,js,mjs}'],
    rules: {
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },

  // api-client.ts is the only client file allowed to use console.error
  // (per architecture §Implementation Patterns → Process Patterns → Client logging).
  {
    files: ['apps/client/src/lib/api-client.ts'],
    rules: {
      'no-console': ['error', { allow: ['error'] }],
    },
  },

  // React hooks rules — client only
  {
    files: ['apps/client/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // Type-aware linting for source files (enables @typescript-eslint/no-floating-promises)
  {
    files: ['apps/**/src/**/*.{ts,tsx}', 'packages/**/src/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Prettier last — disables formatting-related rules that conflict with Prettier.
  prettier,
];
