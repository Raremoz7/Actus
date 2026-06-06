import { useEffect } from 'react';
import { Alert, Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { router, type Href } from 'expo-router';
import {
  CaretRight,
  PencilSimple,
  BellSimple,
  ShieldCheck,
  SignOut,
  UserCircle,
} from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Screen, AppText, KpiNumber, Tag, ListState } from '@/components/ui';
import { useMe } from '@/hooks/useMe';
import { useWeeklyOverview } from '@/hooks/useWeeklyOverview';
import { useLogoutMutation } from '@/features/auth/hooks';
import type { UserTipo } from '@/types/me';
import { darkTheme } from '@/theme';

const { colors, motion } = darkTheme;

type Props = {
  // showStreak → exibe a faixa de KPIs (sequência/recorde). Só faz sentido no aluno:
  // weekly-overview é requireStudent na API.
  showStreak?: boolean;
};

// Rótulo humano do tipo de conta. staff nunca chega aqui (não aparece em /me).
const TIPO_LABEL: Record<UserTipo, string> = {
  aluno: 'Aluno',
  personal: 'Personal trainer',
  nutricionista: 'Nutricionista',
  actus_admin: 'Equipe Actus',
  actus_suporte: 'Suporte Actus',
};

// Inicial do display_name para o avatar placeholder.
function initialOf(name: string | null | undefined): string {
  const first = name?.trim()?.charAt(0);
  return first ? first.toUpperCase() : '·';
}

type ActionRowProps = {
  icon: React.ReactNode;
  label: string;
  // onPress ausente → linha informativa (sem navegação): sem afordância de toque.
  onPress?: () => void;
  danger?: boolean;
  last?: boolean;
  disabled?: boolean;
  // Eyebrow discreta à direita sinalizando indisponível nesta versão.
  soon?: boolean;
};

function ActionRow({
  icon,
  label,
  onPress,
  danger = false,
  last = false,
  disabled = false,
  soon = false,
}: ActionRowProps) {
  const interactive = !!onPress && !disabled;
  // CaretRight só quando há navegação real (não em linha informativa nem em "Sair").
  const showCaret = interactive && !danger && !soon;

  return (
    <Pressable
      accessibilityRole={interactive ? 'button' : 'text'}
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      onPress={interactive ? onPress : undefined}
      disabled={!interactive}
      style={({ pressed }) => [
        styles.row,
        last && styles.rowLast,
        interactive && pressed && styles.rowPressed,
        disabled && styles.rowDisabled,
      ]}
    >
      <View style={styles.rowIcon}>{icon}</View>
      <AppText variant="bodyMd" color={danger ? 'error' : 'primary'} style={styles.rowLabel}>
        {label}
      </AppText>
      {soon ? <Tag label="em breve" /> : null}
      {showCaret ? <CaretRight size={16} weight="bold" color={colors.textTertiary} /> : null}
    </Pressable>
  );
}

export function AccountScreen({ showStreak = false }: Props) {
  const me = useMe();
  const week = useWeeklyOverview();
  const logout = useLogoutMutation();

  const displayName = me.data?.display_name ?? 'Sua conta';
  const tipo = me.data?.tipo;
  const tipoLabel = tipo ? TIPO_LABEL[tipo] : null;

  // ÚNICA animação da tela: reveal de entrada (opacity + translateY, 300ms).
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

  function confirmLogout() {
    Alert.alert('Sair da conta', 'Você precisará entrar de novo para continuar.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => logout.mutate() },
    ]);
  }

  // Loading/erro antes do reveal: a identidade depende de /me e o streak de
  // weekly-overview. Skeleton enquanto carrega; aviso discreto com retry se a
  // busca do perfil falhar.
  const isLoading = me.isLoading || (showStreak && week.isLoading);
  if (isLoading) {
    return (
      <Screen scroll padded>
        <ListState kind="loading" skeletonCount={3} />
      </Screen>
    );
  }

  if (me.isError) {
    return (
      <Screen scroll padded>
        <ListState
          kind="error"
          icon={UserCircle}
          title="Não foi possível carregar a conta"
          message="Verifique a conexão e tente de novo."
          actionLabel="Tentar de novo"
          onAction={() => void me.refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll padded>
      <Animated.View style={revealStyle}>
        {/* Card de identidade. Avatar real é [MOCK — sem endpoint na API v1]: o GET /me
            só devolve { id, tipo, display_name } — avatar_url é write-only via PATCH /me
            e não volta em nenhum GET. Usamos a inicial do display_name até o backend
            expor avatar_url num GET. */}
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <AppText variant="h2" color="neon">
              {initialOf(me.data?.display_name)}
            </AppText>
          </View>
          <View style={styles.identityText}>
            <AppText variant="h3" numberOfLines={1}>
              {displayName}
            </AppText>
            {tipoLabel ? (
              <AppText variant="eyebrow" color="tertiary">
                {tipoLabel}
              </AppText>
            ) : null}
          </View>
        </View>

        {/* Streak: único stat com fonte real (weekly-overview, só aluno). */}
        {showStreak ? (
          <View style={styles.stats}>
            <View style={styles.stat}>
              <KpiNumber value={week.data?.streak_current ?? 0} size="medium" unit="dias" />
              <AppText variant="eyebrow" color="tertiary">
                Sequência
              </AppText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <KpiNumber value={week.data?.streak_best ?? 0} size="medium" unit="dias" />
              <AppText variant="eyebrow" color="tertiary">
                Recorde
              </AppText>
            </View>
          </View>
        ) : null}

        {/* Lista de ações. */}
        <View style={styles.actions}>
          <ActionRow
            icon={<PencilSimple size={20} weight="duotone" color={colors.onSurface} />}
            label="Editar perfil"
            onPress={() => router.push('/editar-perfil' as Href)}
          />
          {/* [MOCK — sem endpoint na API v1]: preferências de notificação ainda não existem.
              Linha informativa (sem navegação morta) com eyebrow "em breve". */}
          <ActionRow
            icon={<BellSimple size={20} weight="duotone" color={colors.onSurface} />}
            label="Notificações"
            soon
          />
          {/* [MOCK — sem endpoint na API v1]: documento legal ainda não disponível no app. */}
          <ActionRow
            icon={<ShieldCheck size={20} weight="duotone" color={colors.onSurface} />}
            label="Termos & privacidade"
            soon
          />
          <ActionRow
            icon={<SignOut size={20} weight="duotone" color={colors.error} />}
            label="Sair"
            danger
            last
            disabled={logout.isPending}
            onPress={confirmLogout}
          />
        </View>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityText: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  statDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: theme.colors.outlineVariant,
  },
  actions: {
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowPressed: {
    backgroundColor: theme.colors.surface2,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  rowIcon: {
    width: 24,
    alignItems: 'center',
  },
  rowLabel: {
    flex: 1,
  },
}));
