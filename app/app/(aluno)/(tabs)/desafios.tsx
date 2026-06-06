import { useEffect } from 'react';
import { RefreshControl, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { router, type Href } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import { Screen, AppText } from '@/components/ui';
import { ChallengeListCard } from '@/components/challenges';
import { useChallenges } from '@/hooks/useChallenges';
import { useChallengeActions } from '@/hooks/useChallengeActions';
import { challengeDayProgress } from '@/lib/challenge';
import { formatDateLocal } from '@/lib/format';
import type { ChallengeListItem } from '@/types/challenges';
import { darkTheme } from '@/theme';

const { motion, colors } = darkTheme;

export default function AlunoDesafiosScreen() {
  const list = useChallenges();
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
  // Convites (invited) primeiro — ação pendente do aluno.
  const invited = items.filter((it) => it.participant_status === 'invited');
  const active = items.filter((it) => it.participant_status === 'active');
  const ordered = [...invited, ...active];

  // Hoje em componentes LOCAIS (nunca toISOString — bug de fuso UTC-3).
  const today = formatDateLocal(new Date());

  function openDetail(id: string) {
    router.push(`/(aluno)/desafio/${id}` as Href);
  }

  function renderCard(item: ChallengeListItem) {
    const { challenge, participant_status } = item;
    const dayProgress = challengeDayProgress(challenge.starts_on, challenge.ends_on, today);
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

  return (
    <Screen edges={['top']}>
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
        <AppText variant="eyebrow" color="tertiary">
          Seus desafios
        </AppText>
        <AppText variant="h2" style={styles.title}>
          Desafios
        </AppText>

        {ordered.map(renderCard)}

        {list.isLoading ? (
          <AppText variant="bodySm" color="tertiary" style={styles.note}>
            Carregando…
          </AppText>
        ) : null}

        {!list.isLoading && !list.isError && ordered.length === 0 ? (
          <AppText variant="bodySm" color="tertiary" style={styles.note}>
            Nenhum desafio por aqui ainda.
          </AppText>
        ) : null}

        {list.isError ? (
          <AppText variant="bodySm" color="tertiary" style={styles.note}>
            Não foi possível carregar agora.
          </AppText>
        ) : null}
      </Animated.View>
      </Animated.ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  scroll: { padding: theme.spacing.lg },
  title: { marginTop: theme.spacing.xs, marginBottom: theme.spacing.lg },
  cardWrap: { marginBottom: theme.spacing.md },
  cardError: { marginTop: theme.spacing.xs },
  note: { marginTop: theme.spacing.lg },
}));
