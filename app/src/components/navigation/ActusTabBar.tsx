import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { darkTheme } from '@/theme';
import { underlineTranslateX } from './underline';

// Descrição de cada aba: rótulo (mono UPPERCASE) + ícone que recebe a cor (ativo/inativo).
export type TabSpec = {
  name: string;
  label: string;
  renderIcon: (color: string) => ReactNode;
};

type ActusTabBarProps = BottomTabBarProps & {
  tabs: readonly TabSpec[];
};

const { colors, motion } = darkTheme;

// Sublinhado neon: largura fixa e duração do deslize (a única animação da barra).
const UNDERLINE_WIDTH = 30;
const SLIDE_MS = 200;

export function ActusTabBar({ state, navigation, tabs }: ActusTabBarProps) {
  const insets = useSafeAreaInsets();

  // Mapa rota→spec para casar a ordem real do navigator com a config declarada.
  const specByName = new Map(tabs.map((t) => [t.name, t]));

  const [barWidth, setBarWidth] = useState(0);
  const tx = useSharedValue(0);
  const firstRef = useRef(true);

  // Move o sublinhado para a aba ativa. Na 1ª medição posiciona direto (sem
  // deslizar do canto); nas trocas seguintes anima com withTiming.
  useEffect(() => {
    if (barWidth <= 0) return;
    const target = underlineTranslateX(
      state.index,
      barWidth,
      state.routes.length,
      UNDERLINE_WIDTH,
    );
    if (firstRef.current) {
      tx.value = target;
      firstRef.current = false;
    } else {
      tx.value = withTiming(target, {
        duration: SLIDE_MS,
        easing: Easing.bezier(
          motion.easing[0],
          motion.easing[1],
          motion.easing[2],
          motion.easing[3],
        ),
      });
    }
  }, [state.index, barWidth, state.routes.length, tx]);

  const underlineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }],
  }));

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

  function onRowLayout(e: LayoutChangeEvent) {
    setBarWidth(e.nativeEvent.layout.width);
  }

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom }]}>
      <View style={styles.row} onLayout={onRowLayout}>
        {state.routes.map((route, index) => {
          const spec = specByName.get(route.name);
          // Rotas sem spec (não deveriam existir) são puladas silenciosamente.
          if (!spec) return null;
          const focused = state.index === index;
          const color = focused ? colors.neon : colors.textTertiary;

          return (
            <Pressable
              key={route.key}
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
        })}

        {barWidth > 0 ? (
          <Animated.View style={[styles.underline, underlineStyle]} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  bar: {
    backgroundColor: theme.colors.surface1,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant,
  },
  // Linha de conteúdo medida (largura) e âncora do sublinhado absoluto.
  row: {
    flexDirection: 'row',
    position: 'relative',
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  label: { marginTop: 2 },
  // Sublinhado neon: acima da área segura (paddingBottom da barra fica por fora).
  underline: {
    position: 'absolute',
    left: 0,
    bottom: theme.spacing.xs,
    width: UNDERLINE_WIDTH,
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.colors.neon,
  },
}));
