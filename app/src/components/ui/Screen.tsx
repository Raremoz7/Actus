import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';

type ScreenProps = {
  children: ReactNode;
  // padded → padding lg em volta do conteúdo.
  padded?: boolean;
  // scroll → conteúdo em ScrollView (keyboardShouldPersistTaps='handled').
  scroll?: boolean;
};

export function Screen({ children, padded = false, scroll = false }: ScreenProps) {
  styles.useVariants({ padded });

  return (
    <SafeAreaView style={styles.safe}>
      {scroll ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, styles.content]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.bgBase,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    variants: {
      padded: {
        true: { padding: theme.spacing.lg },
        false: { padding: 0 },
      },
    },
  },
}));
