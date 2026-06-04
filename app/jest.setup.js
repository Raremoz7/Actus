// Reanimated v4 usa worklets nativos — no jest, substituímos pelo mock oficial.
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// Unistyles 3 exige configure nativo; no jest, StyleSheet.create vira passthrough
// que executa a factory com um theme stub (basta para resolver os estilos).
jest.mock('react-native-unistyles', () => {
  const { darkTheme } = require('@/theme');
  return {
    StyleSheet: {
      create: (styles) => {
        const resolved = typeof styles === 'function' ? styles(darkTheme) : styles;
        resolved.useVariants = () => {};
        return resolved;
      },
      configure: () => {},
    },
  };
});

// Phosphor renderiza SVG; no jest substituímos por um stub leve que preserva o nome.
jest.mock('phosphor-react-native', () => {
  const React = require('react');
  return new Proxy(
    {},
    {
      get: (_t, name) => (props) =>
        React.createElement('icon', { ...props, 'data-icon': String(name) }),
    },
  );
});

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));
