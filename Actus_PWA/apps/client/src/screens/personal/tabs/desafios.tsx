import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { router, type Href } from '@/navigation';
import { CaretRight, Plus, Trophy } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Screen, AppText, Button, Tag, ListState, TopBar, type TagTone } from '@/components/ui';
import {
  challengeTimingLabel,
  deriveChallengeTiming,
} from '@/components/challenges/challengeProgress';
import { useProChallenges } from '@/hooks/useProChallenges';
import type { Challenge } from '@/types/challenges';
import { darkTheme } from '@/theme';

const { colors, motion } = darkTheme;

// Contador no eyebrow: "1 desafio" / "N desafios".
function countLabel(n: number): string {
  return n === 1 ? '1 desafio' : `${n} desafios`;
}

// "YYYY-MM-DD" → "DD/MM" usando componentes LOCAIS (nunca new Date(iso), que
// faz parse UTC e volta um dia em fusos negativos).
function shortBr(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  return `${match[3]}/${match[2]}`;
}

// Período legível do card: "DD/MM – DD/MM".
function periodLabel(starts: string, ends: string): string {
  return `${shortBr(starts)} – ${shortBr(ends)}`;
}

// Mapeia o status do desafio para rótulo + tom do chip.
const STATUS: Record<Challenge['status'], { label: string; tone: TagTone }> = {
  draft: { label: 'Rascunho', tone: 'neutral' },
  active: { label: 'Ativo', tone: 'active' },
  ended: { label: 'Encerrado', tone: 'neutral' },
};

type CardProps = {
  challenge: Challenge;
  onPress: () => void;
};

// Card de desafio: ícone + nome + período + chip de status. Tocável → detalhe.
// A lista REAL não traz participant_count (ver useProChallenges), então não há
// contagem de participantes aqui.
function ProChallengeCard({ challenge, onPress }: CardProps) {
  const status = STATUS[challenge.status];
  // Leitura temporal derivada das datas: 'Dia 4 de 30' / 'Começa em 3 dias' /
  // 'Encerrado'. A lista não traz progresso — derivamos de starts_on/ends_on.
  const timing = deriveChallengeTiming(
    challenge.starts_on,
    challenge.ends_on,
    challenge.status,
  );
  const timingLabel = challengeTimingLabel(timing);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={challenge.name}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.cardIcon}>
        <Trophy size={22} weight="duotone" color={colors.neon} />
      </View>
      <View style={styles.cardText}>
        <AppText variant="h3" numberOfLines={1}>
          {challenge.name}
        </AppText>
        <AppText variant="metaSmall" color="tertiary">
          {periodLabel(challenge.starts_on, challenge.ends_on)}
        </AppText>
        <View style={styles.chipRow}>
          <Tag label={status.label} tone={status.tone} />
          <AppText
            variant="metaSmall"
            color={timing.kind === 'running' ? 'neon' : 'secondary'}
          >
            {timingLabel}
          </AppText>
        </View>
      </View>
      <CaretRight size={16} weight="bold" color={colors.textTertiary} />
    </Pressable>
  );
}

// Aba de desafios do profissional (personal): lista de desafios criados.
// GET /professional/challenges via useProChallenges. "Novo desafio" abre o form
// (/criar-desafio); cada card abre o detalhe (/desafio-pro/:id).
export default function PersonalDesafiosScreen() {
  const list = useProChallenges();

  // 1 momento de motion por tela: reveal de entrada (opacity + translateY, 300ms).
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: motion.screenMs });
    translateY.value = withTiming(0, { duration: motion.screenMs });
  }, [opacity, translateY]);
  const revealStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const challenges = useMemo(() => list.data?.challenges ?? [], [list.data]);

  function openCreate() {
    router.push('/criar-desafio' as Href);
  }

  function openDetail(id: string) {
    router.push(('/desafio-pro/' + id) as Href);
  }

  const isEmpty = !list.isLoading && !list.isError && challenges.length === 0;

  return (
    <Screen edges={['top']}>
      <TopBar title="Desafios" eyebrow={countLabel(challenges.length)} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
      <Animated.View style={revealStyle}>
        <View style={styles.newBtn}>
          <Button
            variant="primary"
            label="Novo desafio"
            icon={<Plus size={18} weight="bold" color={colors.textInverse} />}
            onPress={openCreate}
          />
        </View>

        <View style={styles.list}>
          {challenges.map((c) => (
            <ProChallengeCard
              key={c.id}
              challenge={c}
              onPress={() => openDetail(c.id)}
            />
          ))}
        </View>

        {list.isLoading ? <ListState kind="loading" skeletonCount={3} /> : null}

        {isEmpty ? (
          <ListState
            kind="empty"
            icon={Trophy}
            title="Nenhum desafio ainda"
            message="Crie um desafio para engajar seus alunos por um período"
            actionLabel="Novo desafio"
            onAction={openCreate}
          />
        ) : null}

        {list.isError ? (
          <ListState
            kind="error"
            title="Não foi possível carregar"
            message="Verifique sua conexão e tente novamente."
            actionLabel="Tentar de novo"
            onAction={() => void list.refetch()}
          />
        ) : null}
      </Animated.View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  scroll: { padding: theme.spacing.lg },
  newBtn: {
    marginBottom: theme.spacing.xl,
  },
  list: {
    gap: theme.spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  chipRow: {
    marginTop: theme.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  note: {
    marginTop: theme.spacing.lg,
  },
}));
