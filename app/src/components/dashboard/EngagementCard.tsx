import { View } from 'react-native';
import { ChartLineUp, Pulse } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Card, KpiNumber } from '@/components/ui';
import type { Student } from '@/types/professional';
import {
  buildEngagementOverview,
  checkInAgoLabel,
} from '@/mocks/engagement';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

type Props = {
  students: Student[];
};

// Painel de engajamento agregado: adesão, check-ins da semana e inativos,
// com os check-ins mais recentes. [MOCK] derivado da lista real de alunos
// (ver src/mocks/engagement.ts) até existir GET /professional/overview.
export function EngagementCard({ students }: Props) {
  const overview = buildEngagementOverview(students);
  const hasStudents = students.length > 0;

  return (
    <Card style={styles.cardExtra}>
      <View style={styles.head}>
        <ChartLineUp size={14} weight="duotone" color={colors.textTertiary} />
        <AppText variant="eyebrow" color="tertiary">
          Engajamento
        </AppText>
      </View>

      {hasStudents ? (
        <>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <KpiNumber value={`${overview.adherence_pct}%`} size="medium" tone="neon" />
              <AppText variant="metaSmall" color="tertiary">
                Adesão 7d
              </AppText>
            </View>
            <View style={styles.divider} />
            <View style={styles.stat}>
              <KpiNumber value={overview.checkins_7d} size="medium" tone="primary" />
              <AppText variant="metaSmall" color="tertiary">
                Check-ins
              </AppText>
            </View>
            <View style={styles.divider} />
            <View style={styles.stat}>
              <KpiNumber value={overview.inactive_count} size="medium" tone="primary" />
              <AppText variant="metaSmall" color="tertiary">
                Inativos
              </AppText>
            </View>
          </View>

          {overview.recent.length > 0 ? (
            <View style={styles.recent}>
              {overview.recent.map((c) => (
                <View key={c.student_id} style={styles.recentRow}>
                  <Pulse size={14} weight="duotone" color={colors.neon} />
                  <AppText variant="bodySm" color="secondary" numberOfLines={1} style={styles.recentName}>
                    {c.name}
                  </AppText>
                  <AppText variant="metaSmall" color="tertiary">
                    {checkInAgoLabel(c.days_ago)}
                  </AppText>
                </View>
              ))}
            </View>
          ) : (
            <AppText variant="bodySm" color="tertiary">
              Nenhum check-in nos últimos 7 dias.
            </AppText>
          )}
        </>
      ) : (
        <AppText variant="bodySm" color="secondary">
          Convide alunos para acompanhar adesão e check-ins aqui.
        </AppText>
      )}
    </Card>
  );
}

const styles = StyleSheet.create((theme) => ({
  cardExtra: {
    gap: theme.spacing.md,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  stats: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, gap: theme.spacing.xs },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    marginHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.outlineVariant,
  },
  recent: {
    gap: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant,
    paddingTop: theme.spacing.md,
  },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  recentName: { flex: 1 },
}));
