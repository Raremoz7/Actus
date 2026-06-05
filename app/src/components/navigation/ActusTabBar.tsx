import { Fragment, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { darkTheme } from '@/theme';

// Descrição de cada aba: rótulo (mono UPPERCASE) + ícone que recebe a cor (ativo/inativo).
export type TabSpec = {
  name: string;
  label: string;
  renderIcon: (color: string) => ReactNode;
};

// Botão central opcional (ex.: "iniciar treino do dia" do aluno).
export type CenterAction = {
  renderIcon: (color: string) => ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
};

type ActusTabBarProps = BottomTabBarProps & {
  tabs: readonly TabSpec[];
  // Quando presente, insere um botão circular flutuante no centro da tab bar.
  center?: CenterAction;
};

const { colors } = darkTheme;

export function ActusTabBar({
  state,
  navigation,
  tabs,
  center,
}: ActusTabBarProps) {
  const insets = useSafeAreaInsets();

  // Mapa rota→spec para casar a ordem real do navigator com a config declarada.
  const specByName = new Map(tabs.map((t) => [t.name, t]));

  // Índice onde injetar o botão central: no meio das abas.
  const centerSlot = center ? Math.floor(state.routes.length / 2) : -1;

  function handlePress(routeName: string, routeKey: string, focused: boolean) {
    void Haptics.selectionAsync();
    const event = navigation.emit({
      type: 'tabPress',
      target: routeKey,
      canPreventDefault: true,
    });
    if (!focused && !event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  }

  function handleCenterPress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    center?.onPress();
  }

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom }]}>
      {state.routes.map((route, index) => {
        const spec = specByName.get(route.name);
        // Rotas sem spec (não deveriam existir) são puladas silenciosamente.
        const tabButton = spec ? renderTab(spec, index) : null;

        // Injeta o botão central como COLUNA própria antes da aba do meio,
        // para que todas as colunas (abas + central) dividam a largura igualmente.
        const injectCenter = center && index === centerSlot;

        return (
          <Fragment key={route.key}>
            {injectCenter ? renderCenter() : null}
            {tabButton}
          </Fragment>
        );
      })}
    </View>
  );

  function renderTab(spec: TabSpec, index: number): ReactNode {
    const focused = state.index === index;
    const route = state.routes[index];
    if (!route) return null;
    const color = focused ? colors.neon : colors.textTertiary;

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={focused ? { selected: true } : {}}
        accessibilityLabel={spec.label}
        onPress={() => handlePress(route.name, route.key, focused)}
        style={styles.tab}
      >
        {spec.renderIcon(color)}
        <AppText
          variant="eyebrow"
          color={focused ? 'neon' : 'tertiary'}
          numberOfLines={1}
          style={styles.label}
        >
          {spec.label}
        </AppText>
      </Pressable>
    );
  }

  function renderCenter(): ReactNode {
    if (!center) return null;
    return (
      <View style={styles.centerSlot}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={center.accessibilityLabel}
          onPress={handleCenterPress}
          style={styles.centerButton}
        >
          {center.renderIcon(colors.textInverse)}
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create((theme) => ({
  bar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface1,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
  },
  label: {
    marginTop: 2,
  },
  // Coluna do botão central: mesma largura (flex:1) das abas, mantendo simetria.
  centerSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  // Círculo neon de 56pt. SEM sombra/glow por decisão de design.
  centerButton: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.neon,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
  },
}));
