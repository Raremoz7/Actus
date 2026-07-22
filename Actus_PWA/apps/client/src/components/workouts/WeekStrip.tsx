import { useCallback, useRef } from 'react';
import { ScrollView, useWindowDimensions, View, type LayoutChangeEvent } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import type { StudentWorkout, Weekday } from '@/types/workouts';

const ORDER: Weekday[] = [1, 2, 3, 4, 5, 6, 7];
const SHORT: Record<Weekday, string> = {
  1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb', 7: 'Dom',
};
const FULL: Record<Weekday, string> = {
  1: 'Segunda', 2: 'Terça', 3: 'Quarta', 4: 'Quinta', 5: 'Sexta', 6: 'Sábado', 7: 'Domingo',
};

// Teto de segurança: nomes de treino são texto livre (ex.: "Peito, tríceps, ombro").
// Deixa o nome inteiro respirar, mas corta um nome absurdamente longo p/ não esticar
// demais uma célula.
function dayLabel(name: string): string {
  const t = name.trim();
  return t.length > 22 ? `${t.slice(0, 21)}…` : t;
}

type Props = {
  workouts: StudentWorkout[];
  today: Weekday;
};

// Faixa Seg..Dom em scroll horizontal full-width (sangra a margem da tela): dias de
// treino expandem pro nome completo; descanso fica compacto (ponto); hoje em neon.
// Ao montar, centraliza o dia atual. Visão de relance da semana, sem cortar nomes.
export function WeekStrip({ workouts, today }: Props) {
  // weekday -> primeiro treino ativo agendado nele.
  const byDay = new Map<Weekday, StudentWorkout>();
  for (const w of workouts) {
    if (!w.is_active) continue;
    for (const wd of w.weekdays) {
      if (!byDay.has(wd as Weekday)) byDay.set(wd as Weekday, w);
    }
  }

  const scrollRef = useRef<ScrollView>(null);
  const { width: screenW } = useWindowDimensions();
  // Posição/largura da célula de hoje, medidas no onLayout, p/ centralizar.
  const todayX = useRef(0);
  const todayW = useRef(0);

  // Centraliza a célula de hoje no viewport (largura da tela, já que a faixa sangra
  // de fora a fora). Sem animação: ao abrir já aparece centralizado.
  const centerToday = useCallback(() => {
    const x = Math.max(0, todayX.current + todayW.current / 2 - screenW / 2);
    scrollRef.current?.scrollTo({ x, animated: false });
  }, [screenW]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.bleed}
      contentContainerStyle={styles.row}
      accessibilityRole="summary"
      accessibilityLabel="Semana de treinos"
    >
      {ORDER.map((wd) => {
        const workout = byDay.get(wd);
        const isToday = wd === today;
        const hasWorkout = Boolean(workout);
        const a11y = `${FULL[wd]}, ${hasWorkout ? workout!.workout_name : 'descanso'}${
          isToday ? ', hoje' : ''
        }`;
        const onLayout = isToday
          ? (e: LayoutChangeEvent) => {
              todayX.current = e.nativeEvent.layout.x;
              todayW.current = e.nativeEvent.layout.width;
              centerToday();
            }
          : undefined;
        return (
          <View
            key={wd}
            onLayout={onLayout}
            accessibilityLabel={a11y}
            style={[
              styles.cell,
              hasWorkout ? styles.cellWork : styles.cellRest,
              isToday && styles.cellToday,
            ]}
          >
            <AppText variant="eyebrow" color={isToday ? 'inverse' : 'tertiary'}>
              {SHORT[wd]}
            </AppText>
            {hasWorkout ? (
              <AppText variant="h4" color={isToday ? 'inverse' : 'primary'} numberOfLines={1}>
                {dayLabel(workout!.workout_name)}
              </AppText>
            ) : (
              <View style={[styles.restDot, isToday && styles.restDotToday]} />
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  // Sangra a margem lateral da tela (a tela de treinos tem padding `lg`): a faixa
  // vai de fora a fora, com o conteúdo ainda recuado `lg` nas pontas via paddingH.
  bleed: {
    marginHorizontal: -theme.spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  cell: {
    borderRadius: theme.radius.thumb,
    backgroundColor: theme.colors.surface1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.xs,
    justifyContent: 'flex-start',
  },
  // Dia de treino: largura pelo conteúdo (nome completo).
  cellWork: {},
  // Dia de descanso: compacto, esmaecido, só o ponto.
  cellRest: {
    width: 46,
    paddingHorizontal: 0,
    alignItems: 'center',
    opacity: 0.55,
  },
  // Hoje: pílula neon (cancela o esmaecido do descanso quando hoje é dia off).
  cellToday: {
    backgroundColor: theme.colors.neon,
    opacity: 1,
  },
  restDot: {
    marginTop: theme.spacing.xs,
    width: 4,
    height: 4,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.textTertiary,
  },
  restDotToday: { backgroundColor: theme.colors.textInverse },
}));
