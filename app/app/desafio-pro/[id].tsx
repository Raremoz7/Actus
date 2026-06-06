// Detalhe + gestão de um desafio (lado PROFISSIONAL). Rota '/desafio-pro/:id'.
//
// Reúne tudo que o personal faz com um desafio já criado:
// - Header back + nome + chip de status (rascunho / ativo / encerrado).
// - Info: período (datas curtas LOCAIS) + visibilidade.
// - Gestão de status via PATCH: 'draft' → Publicar ('active'); 'active' →
//   Encerrar ('ended'); 'ended' → sem ação.
// - Participantes: lista atual (do detalhe) + sheet de seleção múltipla para
//   adicionar (POST .../participants).
// - Ranking: GET .../ranking (mesmo shape do aluno) — o dono sempre enxerga,
//   isMe sempre false.
//
// Datas data-only LOCAIS (nunca toISOString — bug UTC-3). 1 momento de motion:
// reveal de entrada da tela; o sheet tem sua própria animação isolada.

import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import {
  CaretLeft,
  Eye,
  EyeSlash,
  UsersThree,
  Warning,
} from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Button, Tag, type TagTone } from '@/components/ui';
import { RankingRow, AddParticipantsSheet } from '@/components/challenges';
import { ChallengeReportKpis } from '@/components/challenges/ChallengeReportKpis';
import { ChallengeTimingHero } from '@/components/challenges/ChallengeTimingHero';
import {
  deriveChallengeTiming,
  invitedAgoLabel,
} from '@/components/challenges/challengeProgress';
import { useProChallengeDetail } from '@/hooks/useProChallengeDetail';
import { useProChallengeRanking } from '@/hooks/useProChallengeRanking';
import { useProChallengeReport } from '@/hooks/useProChallengeReport';
import { useChallengeMutations } from '@/hooks/useChallengeMutations';
import { useStudents } from '@/hooks/useStudents';
import type {
  Challenge,
  ProChallengeParticipant,
} from '@/types/challenges';
import type { Student } from '@/types/professional';
import { darkTheme } from '@/theme';

const { colors, motion } = darkTheme;

// "YYYY-MM-DD" → "DD/MM" usando componentes LOCAIS da string (nunca new Date(iso),
// que faz parse UTC e volta um dia em fusos negativos).
function shortBr(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  return `${match[3]}/${match[2]}`;
}

// Período legível: "DD/MM – DD/MM".
function periodLabel(starts: string, ends: string): string {
  return `${shortBr(starts)} – ${shortBr(ends)}`;
}

// Status do desafio → rótulo + tom do chip (mesmo mapa da aba de desafios).
const STATUS: Record<Challenge['status'], { label: string; tone: TagTone }> = {
  draft: { label: 'Rascunho', tone: 'neutral' },
  active: { label: 'Ativo', tone: 'active' },
  ended: { label: 'Encerrado', tone: 'neutral' },
};

// Visibilidade → rótulo legível.
const VISIBILITY_LABEL: Record<Challenge['visibility'], string> = {
  public_among_participants: 'Ranking público entre participantes',
  private_ranking: 'Ranking privado',
};

// Status do participante → rótulo curto + tom.
const PARTICIPANT_STATUS: Record<
  ProChallengeParticipant['status'],
  { label: string; tone: TagTone }
> = {
  invited: { label: 'Convidado', tone: 'neutral' },
  active: { label: 'Ativo', tone: 'active' },
  declined: { label: 'Recusou', tone: 'neutral' },
};

export default function DesafioProScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const challengeId = typeof params.id === 'string' ? params.id : undefined;

  const detail = useProChallengeDetail(challengeId);
  const ranking = useProChallengeRanking(challengeId);
  const report = useProChallengeReport(challengeId);
  const students = useStudents();
  const { update, addParticipants } = useChallengeMutations();

  const [statusError, setStatusError] = useState<string | undefined>(undefined);
  const [addError, setAddError] = useState<string | undefined>(undefined);
  const [sheetOpen, setSheetOpen] = useState(false);

  // ÚNICA animação da tela: reveal de entrada (opacity + translateY, 300ms).
  const reveal = useSharedValue(0);
  useEffect(() => {
    reveal.value = withTiming(1, { duration: motion.screenMs });
  }, [reveal]);
  const revealStyle = useAnimatedStyle(() => ({
    opacity: reveal.value,
    transform: [{ translateY: (1 - reveal.value) * 12 }],
  }));

  const challenge = detail.data?.challenge;
  const participants = useMemo(
    () => detail.data?.participants ?? [],
    [detail.data],
  );

  // IDs já no desafio (qualquer status) — escondidos da seleção de adicionar.
  const existingIds = useMemo(
    () => new Set(participants.map((p) => p.student_id)),
    [participants],
  );

  // Alunos elegíveis para adicionar: vinculados que ainda não estão no desafio.
  const selectableStudents = useMemo<Student[]>(() => {
    const all = students.data?.students ?? [];
    return all.filter((s) => !existingIds.has(s.id));
  }, [students.data, existingIds]);

  const rankingRows = ranking.data?.ranking ?? [];

  // Quem quebrou a sequência (gancho de retenção): vem por participante no
  // relatório (streak_broken_hint). Indexado por student_id para realçar a linha.
  const brokenStreakIds = useMemo(
    () =>
      new Set(
        (report.data?.participants ?? [])
          .filter((p) => p.streak_broken_hint)
          .map((p) => p.student_id),
      ),
    [report.data],
  );

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(personal)/(tabs)/desafios' as Href);
    }
  }

  // Publicar (draft → active) ou Encerrar (active → ended) via PATCH.
  function handleStatusChange(next: Challenge['status']) {
    if (!challengeId) return;
    setStatusError(undefined);
    update.mutate(
      { id: challengeId, body: { status: next } },
      {
        onError: () => {
          setStatusError('Não foi possível atualizar agora. Tente novamente.');
        },
      },
    );
  }

  // Encerrar é irreversível → confirma antes (mesmo padrão do revogar convite).
  function confirmEnd() {
    Alert.alert(
      'Encerrar desafio',
      'O ranking para de evoluir e não pode ser reaberto.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Encerrar desafio',
          style: 'destructive',
          onPress: () => handleStatusChange('ended'),
        },
      ],
    );
  }

  function handleAddParticipants(studentIds: string[]) {
    if (!challengeId || studentIds.length === 0) return;
    setAddError(undefined);
    addParticipants.mutate(
      { id: challengeId, studentIds },
      {
        onSuccess: () => {
          setSheetOpen(false);
        },
        onError: () => {
          // Mantém o sheet aberto para o profissional tentar de novo.
          setAddError('Não foi possível adicionar agora. Tente novamente.');
        },
      },
    );
  }

  // Loading / erro do detalhe: estado discreto, sem layout pulando.
  if (detail.isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Header onBack={handleBack} name="Desafio" />
        <AppText variant="bodySm" color="tertiary" style={styles.note}>
          Carregando…
        </AppText>
      </SafeAreaView>
    );
  }

  if (detail.isError || !challenge) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Header onBack={handleBack} name="Desafio" />
        <AppText variant="bodySm" color="tertiary" style={styles.note}>
          Não foi possível carregar este desafio.
        </AppText>
      </SafeAreaView>
    );
  }

  const status = STATUS[challenge.status];
  const isPublic = challenge.visibility === 'public_among_participants';
  const timing = deriveChallengeTiming(
    challenge.starts_on,
    challenge.ends_on,
    challenge.status,
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Header onBack={handleBack} name={challenge.name} tag={status} />

      <Animated.View style={[styles.flex, revealStyle]}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* KPI temporal herói: Dia X de Y · Começa em N dias · Encerrado */}
          <ChallengeTimingHero timing={timing} />

          {/* KPIs do relatório: aderência média, dias ativos, participação */}
          {report.data ? <ChallengeReportKpis report={report.data} /> : null}

          {/* Info: período + visibilidade */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <AppText variant="eyebrow" color="tertiary">
                Período
              </AppText>
              <AppText variant="bodyMd" color="primary">
                {periodLabel(challenge.starts_on, challenge.ends_on)}
              </AppText>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <AppText variant="eyebrow" color="tertiary">
                Visibilidade
              </AppText>
              <View style={styles.visRow}>
                {isPublic ? (
                  <Eye size={16} weight="duotone" color={colors.textSecondary} />
                ) : (
                  <EyeSlash
                    size={16}
                    weight="duotone"
                    color={colors.textSecondary}
                  />
                )}
                <AppText variant="bodySm" color="secondary">
                  {VISIBILITY_LABEL[challenge.visibility]}
                </AppText>
              </View>
            </View>
          </View>

          {/* Gestão de status */}
          {challenge.status !== 'ended' ? (
            <View style={styles.section}>
              {challenge.status === 'draft' ? (
                <Button
                  variant="primary"
                  label="Publicar desafio"
                  loading={update.isPending}
                  onPress={() => handleStatusChange('active')}
                />
              ) : (
                <Button
                  variant="secondary"
                  label="Encerrar desafio"
                  loading={update.isPending}
                  onPress={confirmEnd}
                />
              )}
              {statusError ? (
                <AppText variant="bodySm" color="error">
                  {statusError}
                </AppText>
              ) : null}
            </View>
          ) : null}

          {/* Participantes */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <AppText variant="h3">Participantes</AppText>
              <AppText variant="metaSmall" color="tertiary">
                {participants.length === 1
                  ? '1 pessoa'
                  : `${participants.length} pessoas`}
              </AppText>
            </View>

            {participants.length === 0 ? (
              <AppText variant="bodySm" color="tertiary">
                Ninguém adicionado ainda.
              </AppText>
            ) : (
              <View style={styles.participantList}>
                {participants.map((p) => {
                  const ps = PARTICIPANT_STATUS[p.status];
                  const brokeStreak = brokenStreakIds.has(p.student_id);
                  // Subtítulo contextual: convidados → "convidado há N dias";
                  // ativos que quebraram a sequência → gancho de retenção.
                  const subtitle =
                    p.status === 'invited'
                      ? invitedAgoLabel(p.invited_at)
                      : brokeStreak
                        ? 'Quebrou a sequência'
                        : null;
                  return (
                    <View
                      key={p.student_id}
                      style={[
                        styles.participantRow,
                        brokeStreak && styles.participantRowAlert,
                      ]}
                    >
                      <View style={styles.participantAvatar}>
                        {brokeStreak ? (
                          <Warning
                            size={18}
                            weight="duotone"
                            color={colors.warning}
                          />
                        ) : (
                          <UsersThree
                            size={18}
                            weight="duotone"
                            color={colors.neon}
                          />
                        )}
                      </View>
                      <View style={styles.participantText}>
                        <AppText
                          variant="bodyMd"
                          color="primary"
                          numberOfLines={1}
                        >
                          {p.display_name ?? 'Aluno'}
                        </AppText>
                        {subtitle ? (
                          <AppText
                            variant="metaSmall"
                            color={brokeStreak ? 'error' : 'tertiary'}
                            numberOfLines={1}
                          >
                            {subtitle}
                          </AppText>
                        ) : null}
                      </View>
                      <Tag label={ps.label} tone={ps.tone} />
                    </View>
                  );
                })}
              </View>
            )}

            {challenge.status !== 'ended' ? (
              <Button
                variant="secondary"
                label="Adicionar participantes"
                onPress={() => {
                  setAddError(undefined);
                  setSheetOpen(true);
                }}
              />
            ) : null}

            {addError ? (
              <AppText variant="bodySm" color="error">
                {addError}
              </AppText>
            ) : null}
          </View>

          {/* Ranking */}
          <View style={styles.section}>
            <AppText variant="h3">Ranking</AppText>
            {ranking.isLoading ? (
              <AppText variant="bodySm" color="tertiary">
                Carregando ranking…
              </AppText>
            ) : ranking.isError ? (
              <AppText variant="bodySm" color="tertiary">
                Ranking indisponível agora.
              </AppText>
            ) : rankingRows.length === 0 ? (
              <AppText variant="bodySm" color="tertiary">
                Ainda sem movimento no ranking.
              </AppText>
            ) : (
              <View style={styles.rankingList}>
                {rankingRows.map((row) => (
                  <RankingRow
                    key={row.student_id}
                    position={row.position}
                    name={row.display_name ?? 'Aluno'}
                    activeDays={row.active_days}
                    streak={row.streak_current_in_challenge}
                    isMe={false}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </Animated.View>

      <AddParticipantsSheet
        visible={sheetOpen}
        students={selectableStudents}
        loading={students.isLoading}
        saving={addParticipants.isPending}
        onClose={() => setSheetOpen(false)}
        onConfirm={handleAddParticipants}
      />
    </SafeAreaView>
  );
}

// Header reutilizável (mesmo nos estados de loading/erro): back + nome + chip.
function Header({
  onBack,
  name,
  tag,
}: {
  onBack: () => void;
  name: string;
  tag?: { label: string; tone: TagTone };
}) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        hitSlop={12}
        onPress={onBack}
        style={styles.back}
      >
        <CaretLeft size={20} weight="bold" color={colors.textSecondary} />
      </Pressable>
      <View style={styles.headerText}>
        <AppText variant="eyebrow" color="tertiary">
          Desafio
        </AppText>
        <AppText variant="h2" numberOfLines={1}>
          {name}
        </AppText>
      </View>
      {tag ? <Tag label={tag.label} tone={tag.tone} /> : null}
    </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  back: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.xl,
  },
  note: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  infoCard: {
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  infoRow: {
    gap: theme.spacing.xs,
  },
  infoDivider: {
    height: 1,
    backgroundColor: theme.colors.outlineVariant,
  },
  visRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  section: {
    gap: theme.spacing.md,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  participantList: {
    gap: theme.spacing.sm,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  // Realce discreto de quem quebrou a sequência (borda âmbar).
  participantRowAlert: {
    borderColor: theme.colors.warning,
  },
  participantAvatar: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantText: {
    flex: 1,
    gap: 2,
  },
  rankingList: {
    gap: theme.spacing.xs,
  },
}));
