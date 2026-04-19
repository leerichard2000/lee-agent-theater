/**
 * ESLint 9 flat config para o monorepo Lee Agent Theater.
 *
 * Estratégia: regras mínimas e pragmáticas para um repo que está saindo
 * de "lint: echo 'ok'" para lint real (#7dd2603f). O foco agora é destravar
 * o CI (`pnpm lint` com exit 0) sem reformular todo o código.
 *
 * Regras ativas:
 *  - `@typescript-eslint/recommended` (base sem type-info — rápido no CI).
 *  - `react-hooks/rules-of-hooks` + `react-hooks/exhaustive-deps` no `apps/web`.
 *  - `no-unused-vars` relaxada para ignorar identificadores prefixados com `_`
 *    (padrão já usado no projeto para args não utilizados).
 *  - `prettier` via `eslint-config-prettier` desativa conflitos estilísticos.
 *
 * Progressivo: endurecer regras em tasks futuras (type-checked rules, import
 * ordering, etc.). Não é prioridade aqui.
 */

import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

export default [
  // Ignores globais
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/*.tsbuildinfo',
      '.playwright-mcp/**',
      'docs/screenshots/**',
      'eslint.config.js',
      '**/vite.config.*',
      '**/postcss.config.*',
      '**/tailwind.config.*',
    ],
  },

  // Base TypeScript (sem type-info para CI rápido)
  ...tseslint.configs.recommended,

  // Regras comuns a todo o monorepo
  {
    files: ['**/*.{ts,tsx,js,mjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
    },
    rules: {
      // Permite `_unused` em args/destructuring sem warning. Padrão já em uso.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // `any` aparece em alguns lugares de interop com libs externas (Phaser,
      // validação Zod). Tratamos como warning para não bloquear sem refactor.
      '@typescript-eslint/no-explicit-any': 'warn',
      // Estamos em early-stage: `@ts-expect-error` com descrição é aceito,
      // `@ts-ignore` desincentivado mas não bloqueante.
      '@typescript-eslint/ban-ts-comment': [
        'warn',
        {
          'ts-expect-error': 'allow-with-description',
          'ts-ignore': true,
          'ts-nocheck': true,
          'ts-check': false,
        },
      ],
      // Regras nativas
      'no-console': 'off',
      'no-empty': ['warn', { allowEmptyCatch: true }],
    },
  },

  // Overrides para o frontend React
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        fetch: 'readonly',
        WebSocket: 'readonly',
        localStorage: 'readonly',
        HTMLElement: 'readonly',
        KeyboardEvent: 'readonly',
      },
    },
    settings: {
      react: { version: '18.3' },
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // React 17+ JSX transform — import React não é obrigatório
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
  },

  // Desativa regras que conflitam com Prettier — sempre por último
  prettier,
];
