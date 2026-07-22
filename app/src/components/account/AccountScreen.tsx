import { useEffect, useState, type ReactNode } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { router, type Href } from '@/navigation';
import {
  CaretRight,
  PencilSimple,
  BellSimple,
  ShieldCheck,
  SignOut,
  Ticket,
  Trophy,
  UserCircle,
} from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Screen, AppText, KpiNumber, Tag, ListState, TopBar, ConfirmDialog } from '@/components/ui';
import { useMe } from '@/hooks/useMe';
import { useMyProfile } from '@/hooks/useMyProfile';
import { useWeeklyOverview } from '@/hooks/useWeeklyOverview';
import { useLogoutMutation } from '@/features/auth/hooks';
import type { UserTipo } from '@/types/me';
import { useAuthStore } from '@/store/authStore';
import { DEV_BYPASS_AUTH, reloadApp } from '@/lib/devAuth';
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

// [DEV] Áreas alternáveis pelo switcher — só as que têm rota própria (aluno/personal/
// nutri). admin/suporte não têm área, então ficam de fora.
const DEV_TIPOS: { tipo: UserTipo; label: string }[] = [
  { tipo: 'aluno', label: 'Aluno' },
  { tipo: 'personal', label: 'Personal' },
  { tipo: 'nutricionista', label: 'Nutri' },
];

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

// Casca da tela de conta: top bar fixa "Perfil" + conteúdo rolável. Também envolve os
// estados de loading/erro para a barra nunca "piscar" entre transições.
function PerfilShell({ children }: { children: ReactNode }) {
  return (
    <Screen edges={['top']}>
      <TopBar title="Perfil" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </Screen>
  );
}

export function AccountScreen({ showStreak = false }: Props) {
  const me = useMe();
  const profile = useMyProfile();
  const week = useWeeklyOverview();
  const logout = useLogoutMutation();
  const [confirmingLogout, setConfirmingLogout] = useState(false);

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
    setConfirmingLogout(true);
  }

  // [DEV] Troca de área: persiste o tipo e REINICIA o app. Trocar in-app não funciona —
  // as 3 áreas (aluno/personal/nutri) compartilham as mesmas URLs (grupos são invisíveis
  // na rota), então o router não troca o navegador já montado e a tela "não sai do lugar".
  // O reload deixa o dispatcher (app/index) montar só a área alvo, do zero.
  function switchDevTipo(next: UserTipo) {
    if (next === tipo) return;
    useAuthStore.getState().devSetTipo(next);
    reloadApp();
  }

  // Loading/erro antes do reveal: a identidade depende de /me e o streak de
  // weekly-overview. Skeleton enquanto carrega; aviso discreto com retry se a
  // busca do perfil falhar.
  const isLoading = me.isLoading || (showStreak && week.isLoading);
  if (isLoading) {
    return (
      <PerfilShell>
        <ListState kind="loading" skeletonCount={3} />
      </PerfilShell>
    );
  }

  if (me.isError) {
    return (
      <PerfilShell>
        <ListState
          kind="error"
          icon={UserCircle}
          title="Não foi possível carregar a conta"
          message="Verifique a conexão e tente de novo."
          actionLabel="Tentar de novo"
          onAction={() => void me.refetch()}
        />
      </PerfilShell>
    );
  }

  return (
    <PerfilShell>
      <Animated.View style={revealStyle}>
        {/* Card de identidade. avatar_url vem de GET /me/profile (useMyProfile); sem foto,
            cai na inicial do display_name. */}
        <View style={styles.identity}>
          <View style={styles.avatar}>
            {profile.data?.avatar_url ? (
              <Image
                source={{ uri: profile.data.avatar_url }}
                style={styles.avatarImg}
                accessibilityLabel="Sua foto"
              />
            ) : (
              <AppText variant="h2" color="neon">
                {initialOf(me.data?.display_name)}
              </AppText>
            )}
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
          {tipo === 'aluno' ? (
            <ActionRow
              icon={<Trophy size={20} weight="duotone" color={colors.onSurface} />}
              label="Conquistas"
              onPress={() => router.push('/(aluno)/badges' as Href)}
            />
          ) : null}
          {tipo === 'aluno' ? (
            <ActionRow
              icon={<Ticket size={20} weight="duotone" color={colors.onSurface} />}
              label="Usar convite"
              onPress={() => router.push('/usar-convite' as Href)}
            />
          ) : null}
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

        {/* [DEV — bypass de auth] Atalho de QA: pular entre as áreas sem login real.
            Só aparece com o bypass ligado. */}
        {DEV_BYPASS_AUTH ? (
          <View style={styles.devBlock}>
            <AppText variant="eyebrow" color="tertiary" style={styles.devLabel}>
              DEV · Trocar área
            </AppText>
            <View style={styles.devRow}>
              {DEV_TIPOS.map(({ tipo: t, label }) => {
                const active = t === tipo;
                return (
                  <Pressable
                    key={t}
                    accessibilityRole="button"
                    accessibilityLabel={`Mudar para ${label}`}
                    accessibilityState={{ selected: active }}
                    onPress={() => switchDevTipo(t)}
                    style={[styles.devPill, active && styles.devPillActive]}
                  >
                    <AppText variant="metaSmall" color={active ? 'inverse' : 'secondary'}>
                      {label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}
      </Animated.View>

      <ConfirmDialog
        visible={confirmingLogout}
        title="Sair da conta"
        message="Você precisará entrar de novo para continuar."
        confirmLabel="Sair"
        tone="destructive"
        loading={logout.isPending}
        onCancel={() => setConfirmingLogout(false)}
        onConfirm={() => {
          setConfirmingLogout(false);
          logout.mutate();
        }}
      />
    </PerfilShell>
  );
}

const styles = StyleSheet.create((theme) => ({
  // Conteúdo rolável abaixo da top bar fixa (a barra tem respiro próprio).
  scroll: { padding: theme.spacing.lg },
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
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
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
  // [DEV] Switcher de área — bloco discreto abaixo das ações.
  devBlock: {
    marginTop: theme.spacing.xl,
  },
  devLabel: {
    marginBottom: theme.spacing.sm,
  },
  devRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  devPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  devPillActive: {
    backgroundColor: theme.colors.neon,
    borderColor: theme.colors.neon,
  },
}));
