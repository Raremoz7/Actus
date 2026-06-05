// ESLint flat config — Expo + TypeScript estrito (zero any)
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  {
    ignores: [
      'dist/**',
      '.expo/**',
      'node_modules/**',
      '.superpowers/**',
      '.claude/worktrees/**',
      '.claire/**',
      'ios/**',
      'android/**',
    ],
  },
  expoConfig,
  {
    // Regra do plugin @typescript-eslint — só onde o plugin existe (arquivos TS)
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      // Falso positivo com o padrão canônico axios.create() — regra puramente estilística
      'import/no-named-as-default-member': 'off',
    },
  },
  {
    // Arquivos de infraestrutura de testes (JS puro, globals do jest)
    files: ['jest.config.js', 'jest.setup.js', '**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    languageOptions: {
      globals: {
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
]);
