// Reanimated v4 (com react-native-worklets) — o mock oficial importa worklets nativos
// que falham em jest. Usamos stub manual com os exports que o projeto consume.
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  const noop = () => {};
  const useSharedValue = (init) => ({ value: init });
  const useAnimatedStyle = (fn) => {
    try { fn(); } catch (_) {}
    return {};
  };
  const withTiming = (v) => v;
  const withSpring = (v) => v;
  const withRepeat = (v) => v;
  const withSequence = (...args) => args[0];
  const cancelAnimation = noop;
  const FadeIn = { duration: noop };
  const FadeOut = { duration: noop };
  const Animated = {
    View: View,
    Text: require('react-native').Text,
    Image: require('react-native').Image,
    ScrollView: require('react-native').ScrollView,
    createAnimatedComponent: (C) => C,
    Value: class { constructor(v) { this._v = v; } setValue(v) { this._v = v; } },
  };
  return {
    __esModule: true,
    default: Animated,
    Animated,
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing: {
      bezier: () => (t) => t,
      linear: (t) => t,
      out: (fn) => fn,
      inOut: (fn) => fn,
      cubic: (t) => t,
    },
    withSpring,
    withRepeat,
    withSequence,
    cancelAnimation,
    FadeIn,
    FadeOut,
    interpolate: (v) => v,
    Extrapolation: { CLAMP: 'clamp' },
    runOnJS: (fn) => fn,
    runOnUI: (fn) => fn,
    useAnimatedGestureHandler: () => ({}),
    useAnimatedScrollHandler: () => ({}),
    useAnimatedRef: () => ({ current: null }),
    useAnimatedReaction: noop,
    useDerivedValue: (fn) => ({ value: fn() }),
    useFrameCallback: noop,
    useScrollViewOffset: () => ({ value: 0 }),
  };
});

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
  selectionAsync: jest.fn(),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

// lottie-react-native — renderiza animação nativa; no jest vira uma View simples
// que preserva os props (não quebra no ambiente de teste).
jest.mock('lottie-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: (props) => React.createElement(View, props),
  };
});

// expo-audio — player nativo; no jest expomos a API consumida (createAudioPlayer)
// com no-ops para o som best-effort não quebrar nos testes.
jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn(),
    remove: jest.fn(),
    release: jest.fn(),
  })),
  setIsAudioActiveAsync: jest.fn(() => Promise.resolve()),
}));

// expo-linear-gradient — nativo; no jest retorna View simples.
jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    LinearGradient: ({ children, ...props }) => React.createElement(View, props, children),
  };
});

// react-native-safe-area-context — nativo; retorna stubs sem bridge.
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaView: ({ children, ...props }) => React.createElement(View, props, children),
    SafeAreaProvider: ({ children, ...props }) => React.createElement(View, props, children),
    useSafeAreaInsets: () => insets,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 375, height: 812 }),
    SafeAreaInsetsContext: React.createContext(insets),
    initialWindowMetrics: { insets, frame: { x: 0, y: 0, width: 375, height: 812 } },
  };
});
