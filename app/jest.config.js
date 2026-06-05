/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Ignora as git worktrees aninhadas em .claude/worktrees — senão o jest do
  // tree principal varre os testes/package.json delas (módulos haste duplicados).
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/.claude/worktrees/', '<rootDir>/.claire/'],
  modulePathIgnorePatterns: ['<rootDir>/.claude/worktrees/', '<rootDir>/.claire/'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-unistyles|react-native-reanimated|phosphor-react-native))',
  ],
};
