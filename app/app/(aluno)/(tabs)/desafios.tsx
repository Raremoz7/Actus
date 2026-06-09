import { useEffect } from 'react';
import { RefreshControl, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { router, type Href } from 'expo-router';
import { Trophy } from 'phosphor-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { StyleSheet } from 'react-native-unistyles';

import { Screen, AppText, ListState, TopBar } from '@/components/ui';
import { ChallengeListCard, ChallengeSectionHeader } from '@/components/challenges';
import { useChallenges } from '@/hooks/useChallenges';
import { useChallengeActions } from '@/hooks/useChallengeActions';
import { challengeRankingQueryKey } from '@/hooks/useChallengeRanking';
import { useMe } from '@/hooks/useMe';
import { challengeDayProgress, challengeStatusLabel } from '@/lib/challenge';
import { formatDateLocal } from '@/lib/format';
import type { ChallengeListItem, RankingResponse } from '@/types/challenges';
import { darkTheme } from '@/theme';

const { motion, colors } = darkTheme;

// Dias inteiros entre duas datas YYYY-MM-DD (UTC puro só p/ contar, nunca exibir).
function daysUntil(fromToday: string, target: string): number {
  const toNum = (s: string) => {
    const [y, m, d] = s.split('-').map(Number);
    return Math.floor(Date.UTC(y!, m! - 1, d!) / 86_400_000);
  };
  return toNum(target) - toNum(fromToday);
}

export default function AlunoDesafiosScreen() {
  const list = useChallenges();
  const me = useMe();
  const queryClient = useQueryClient();
  const { accept, decline } = useChallengeActions();

  // 1 momento de motion por tela: reveal de entrada.
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

  const items = list.data?.challenges ?? [];
  const invited = items.filter((it) => it.participant_status === 'invited');
  const active = items.filter((it) => it.participant_status === 'active');

  // Hoje em componentes LOCAIS (nunca toISOString — bug de fuso UTC-3).
  const today = formatDateLocal(new Date());
  const myId = me.data?.id;

  function openDetail(id: string) {
    router.push(`/(aluno)/desafio/${id}` as Href);
  }

  // Teaser de ranking: lido do CACHE (sem fetch novo nem hook em loop). Só existe
  // depois que o aluno abriu o detalhe; aparece quando público e ele tem posição.
  function rankingTeaser(challengeId: string): { position: number; streak: number } | null {
    if (!myId) return null;
    const cached = queryClient.getQueryData<RankingResponse>(
      challengeRankingQueryKey(challengeId),
    );
    if (!cached || cached.visibility !== 'public_among_participants') return null;
    const mine = cached.ranking.find((r) => r.student_id === myId);
    if (!mine) return null;
    return { position: mine.position, streak: mine.streak_current_in_challenge };
  }

  function renderCard(item: ChallengeListItem) {
    const { challenge, participant_status } = item;
    const dayProgress = challengeDayProgress(challenge.starts_on, challenge.ends_on, today);
    const statusLabel = challengeStatusLabel(challenge.status, participant_status);
    const untilStart = Math.max(0, daysUntil(today, challenge.starts_on));
    // Trava só o card cuja mutation está em curso (variables guarda o id alvo).
    const accepting = accept.isPending && accept.variables === challenge.id;
    const declining = decline.isPending && decline.variables === challenge.id;
    const failed =
      (accept.isError && accept.variables === challenge.id) ||
      (decline.isError && decline.variables === challenge.id);
    return (
      <View key={challenge.id} style={styles.cardWrap}>
        <ChallengeListCard
          name={challenge.name}
          dayProgress={dayProgress}
          status={challenge.status}
          participantStatus={participant_status}
          statusLabel={statusLabel}
          daysUntilStart={untilStart}
          rankingTeaser={participant_status === 'active' ? rankingTeaser(challenge.id) : null}
          onPress={() => openDetail(challenge.id)}
          onAccept={() => accept.mutate(challenge.id)}
          onDecline={() => decline.mutate(challenge.id)}
          accepting={accepting}
          declining={declining}
        />
        {failed ? (
          <AppText variant="bodySm" color="error" style={styles.cardError}>
            Não foi possível concluir. Tente de novo.
          </AppText>
        ) : null}
      </View>
    );
  }

  const isEmpty = !list.isLoading && !list.isError && items.length === 0;

  return (
    <Screen edges={['top']}>
      <TopBar title="Desafios" eyebrow="Seus desafios" />
      <Animated.ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={list.isRefetching}
            onRefresh={() => void list.refetch()}
            tintColor={colors.neon}
            colors={[colors.neon]}
          />
        }
      >
        <Animated.View style={revealStyle}>
          {invited.length > 0 ? (
            <View style={styles.section}>
              <ChallengeSectionHeader
                label="Aguardando sua resposta"
                count={invited.length}
              />
              {invited.map(renderCard)}
            </View>
          ) : null}

          {active.length > 0 ? (
            <View style={styles.section}>
              <ChallengeSectionHeader label="Em andamento" count={active.length} />
              {active.map(renderCard)}
            </View>
          ) : null}

          {list.isLoading ? <ListState kind="loading" skeletonCount={3} /> : null}

          {isEmpty ? (
            <ListState
              kind="empty"
              icon={Trophy}
              title="Nenhum desafio ainda"
              message="Quando seu treinador criar um desafio e te convidar, ele aparece aqui."
            />
          ) : null}

          {list.isError ? (
            <ListState
              kind="error"
              title="Não foi possível carregar"
              message="Verifique sua conexão e tente de novo."
              actionLabel="Tentar de novo"
              onAction={() => void list.refetch()}
            />
          ) : null}
        </Animated.View>
      </Animated.ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  scroll: { padding: theme.spacing.lg },
  section: { marginBottom: theme.spacing.lg },
  cardWrap: { marginBottom: theme.spacing.md },
  cardError: { marginTop: theme.spacing.xs },
}));
