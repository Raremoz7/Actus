/** @type {import('jest').Config} */
module.exports = {
  preset: 'react-native',
  // Mock oficial do gesture-handler (o jest-expo fazia isso automaticamente).
  setupFiles: ['react-native-gesture-handler/jestSetup'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // SVGs viram componentes via transformer no Metro; no jest, um stub.
    '\\.svg$': '<rootDir>/jest.svgMock.js',
  },
  // Ignora as git worktrees aninhadas em .claude/worktrees — senão o jest do
  // tree principal varre os testes/package.json delas (módulos haste duplicados).
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/.claude/worktrees/', '<rootDir>/.claire/'],
  modulePathIgnorePatterns: [
    '<rootDir>/.claude/worktrees/',
    '<rootDir>/.claire/',
    '<rootDir>/android/',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation/.*|react-navigation|react-native-svg|react-native-unistyles|react-native-reanimated|react-native-worklets|react-native-nitro-modules|react-native-edge-to-edge|react-native-keychain|react-native-bootsplash|react-native-linear-gradient|react-native-haptic-feedback|react-native-image-picker|@react-native-clipboard|@react-native-firebase|phosphor-react-native|lottie-react-native))',
  ],
};
