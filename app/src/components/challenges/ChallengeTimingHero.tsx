// KPI temporal HERÓI do detalhe do desafio (lado PROFISSIONAL).
//  - running  → 'Dia X de Y' + barra de progresso (ratio).
//  - upcoming → 'Começa em N dias' (sem barra).
//  - ended    → 'Encerrado'.
//
// É o único bloco "grande" do topo. Sem motion próprio (a tela já tem o reveal).
// Barra é estática (largura via ratio) — não conta como momento de motion.

import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Card } from '@/components/ui';
import {
  challengeTimingLabel,
  type ChallengeTiming,
} from './challengeProgress';

type Props = {
  timing: ChallengeTiming;
};

export function ChallengeTimingHero({ timing }: Props) {
  const ratio = timing.kind === 'running' ? timing.ratio : 0;
  const widthPct = `${Math.round(ratio * 100)}%` as const;

  // Eyebrow contextual conforme a fase.
  const eyebrow =
    timing.kind === 'running'
      ? 'Em andamento'
      : timing.kind === 'upcoming'
        ? 'Agendado'
        : 'Concluído';

  return (
    <Card padding="lg" style={styles.cardExtra}>
      <AppText variant="eyebrow" color="tertiary">
        {eyebrow}
      </AppText>

      {timing.kind === 'running' ? (
        <View style={styles.runningValue}>
          <AppText variant="dataBig" color="neon">
            {`Dia ${timing.dayCurrent}`}
          </AppText>
          <AppText variant="dataMed" color="tertiary">
            {`de ${timing.dayTotal}`}
          </AppText>
        </View>
      ) : (
        <AppText variant="h3" color="primary">
          {challengeTimingLabel(timing)}
        </AppText>
      )}

      {timing.kind === 'running' ? (
        <View
          style={styles.track}
          accessibilityRole="progressbar"
          accessibilityValue={{
            min: 0,
            max: timing.dayTotal,
            now: timing.dayCurrent,
          }}
        >
          <View style={[styles.fill, { width: widthPct }]} />
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create((theme) => ({
  cardExtra: {
    gap: theme.spacing.sm,
  },
  runningValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing.sm,
  },
  track: {
    height: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface3,
    overflow: 'hidden',
    marginTop: theme.spacing.xs,
  },
  fill: {
    height: '100%',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.neon,
  },
}));
