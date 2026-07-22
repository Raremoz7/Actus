import type { ComponentType } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

// Enquadra as telas do app numa coluna centralizada em telas largas (desktop),
// e ocupa tudo no mobile. A landing NÃO usa isso (quer largura total).
// A largura-alvo (~600) mantém a leitura mobile-first confortável no desktop.
export function AppFrame({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.outer}>
      <View style={styles.inner}>{children}</View>
    </View>
  );
}

// HOC para registrar telas já enquadradas no navigator.
export function withAppFrame<P extends object>(Component: ComponentType<P>): ComponentType<P> {
  function Framed(props: P) {
    return (
      <AppFrame>
        <Component {...props} />
      </AppFrame>
    );
  }
  Framed.displayName = `withAppFrame(${Component.displayName || Component.name || 'Screen'})`;
  return Framed;
}

const styles = StyleSheet.create((theme) => ({
  outer: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: theme.colors.bgLowest,
  },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: {
      xs: undefined,
      md: 600,
    },
    // Borda sutil separando a coluna do gutter no desktop.
    borderColor: theme.colors.outline,
    borderLeftWidth: { xs: 0, md: StyleSheet.hairlineWidth },
    borderRightWidth: { xs: 0, md: StyleSheet.hairlineWidth },
  },
}));
