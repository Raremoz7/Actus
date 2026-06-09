import type { ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from './Text';

type Props = {
  // Forma simples: título (h2) + eyebrow opcional acima. Cobre a maioria das abas.
  title?: string;
  eyebrow?: string;
  // Forma livre: para barras com ação à direita (ex.: Alunos) ou conteúdo não-título
  // (ex.: data + saudação na Home). Quando presente, ignora title/eyebrow.
  children?: ReactNode;
};

// Barra fixa de topo de tela: ancorada acima do scroll (não rola com o conteúdo), com
// respiro lateral próprio e uma hairline de separação. Renderize como PRIMEIRO filho do
// Screen, irmã (acima) do ScrollView. Mantém as abas consistentes.
export function TopBar({ title, eyebrow, children }: Props) {
  return (
    <View style={styles.bar}>
      {children ?? (
        <>
          {eyebrow ? (
            <AppText variant="eyebrow" color="tertiary">
              {eyebrow}
            </AppText>
          ) : null}
          {title ? (
            <AppText variant="h2" numberOfLines={1} style={eyebrow ? styles.titleGap : undefined}>
              {title}
            </AppText>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  bar: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  titleGap: { marginTop: theme.spacing.xs },
}));
