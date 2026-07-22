// Aluno logado usa um convite para se vincular a um NOVO profissional
// (POST /invites/consume — REAL). Rota raiz, FORA dos grupos: o guard de (aluno)
// expulsaria um profissional antes do aviso "Convites são para alunos".
// 1 momento de motion por tela: reveal de entrada.
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Redirect, router, useLocalSearchParams } from '@/navigation';
import { CaretLeft, CheckCircle, UserCircle } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Button, Card, Input } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { useConsumeInvite } from '@/hooks/useConsumeInvite';
import { useLogoutMutation } from '@/features/auth/hooks';
import { authErrorMessage } from '@/features/auth/errors';
import { isApiError } from '@/api/errors';
import { AUTH_ENTRY, homeForTipo } from '@/lib/authRoutes';
import { goBackOr } from '@/lib/nav';
import type { ConsumeInviteResponse } from '@/types/invites';
import { darkTheme } from '@/theme';

const { colors, motion } = darkTheme;

const CODE_RE = /^[A-Za-z0-9_-]{3,200}$/;

const ROLE_LABEL: Record<ConsumeInviteResponse['professional_role'], string> = {
  personal: 'personal',
  nutricionista: 'nutricionista',
};

// Papel do conflito quando o backend detalhar em extras (defensivo).
function conflictMessage(extras: Record<string, unknown>): string {
  const role = extras['professional_role'];
  const label =
    role === 'personal' || role === 'nutricionista' ? ROLE_LABEL[role] : 'profissional';
  return `Você já tem um ${label} ativo. Fale com ele antes de trocar.`;
}

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export default function UsarConviteScreen() {
  const params = useLocalSearchParams<{ code?: string | string[] }>();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const consume = useConsumeInvite();
  const logout = useLogoutMutation();

  const [code, setCode] = useState(() => firstParam(params.code));
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<ConsumeInviteResponse | null>(null);
  // only_student_can_consume do backend renderiza o MESMO aviso do guard local.
  const [blockedForRole, setBlockedForRole] = useState(false);

  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: motion.screenMs });
  }, [opacity]);
  const revealStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (status !== 'authenticated' || !user) {
    return <Redirect href={AUTH_ENTRY} />;
  }

  if (user.tipo !== 'aluno' || blockedForRole) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.centerWrap}>
          <AppText variant="eyebrow" color="neon">
            Convite
          </AppText>
          <AppText variant="h2" style={styles.title}>
            Convites são para alunos
          </AppText>
          <AppText variant="bodyMd" color="secondary" style={styles.note}>
            Este link vincula um aluno a um profissional. Para usá-lo, entre com uma
            conta de aluno.
          </AppText>
          <Button
            variant="secondary"
            label="Trocar de conta"
            disabled={logout.isPending}
            onPress={() => logout.mutate()}
          />
          <Button
            variant="ghost"
            label="Voltar"
            onPress={() => goBackOr(homeForTipo(user.tipo) as string)}
          />
        </View>
      </SafeAreaView>
    );
  }

  function handleConfirm() {
    setError(null);
    const trimmed = code.trim();
    if (!CODE_RE.test(trimmed)) {
      setError('Código de convite inválido.');
      return;
    }
    consume.mutate(trimmed, {
      onSuccess: (res) => setDone(res),
      onError: (err) => {
        if (isApiError(err)) {
          if (err.code === 'only_student_can_consume') {
            setBlockedForRole(true);
            return;
          }
          if (err.code === 'already_has_active_professional_for_role') {
            setError(conflictMessage(err.extras));
            return;
          }
          setError(authErrorMessage(err.code));
          return;
        }
        setError(authErrorMessage('unknown'));
      },
    });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topbar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          onPress={() => goBackOr(homeForTipo('aluno') as string)}
          hitSlop={12}
        >
          <CaretLeft size={24} weight="bold" color={colors.textPrimary} />
        </Pressable>
      </View>

      <Animated.View style={[styles.flex, revealStyle]}>
        {done ? (
          <View style={styles.centerWrap}>
            <CheckCircle size={40} weight="duotone" color={colors.neon} />
            <AppText variant="h2" style={styles.title}>
              {done.note === 'already_linked' ? 'Vínculo já existia' : 'Vínculo criado'}
            </AppText>
            <AppText variant="bodyMd" color="secondary" style={styles.note}>
              {done.note === 'already_linked'
                ? 'Você já está vinculado a este profissional.'
                : `Você está vinculado ao seu novo ${ROLE_LABEL[done.professional_role]}.`}
            </AppText>
            <Button
              variant="primary"
              label="Concluir"
              onPress={() => router.replace(homeForTipo('aluno'))}
            />
          </View>
        ) : (
          <View style={styles.body}>
            <AppText variant="eyebrow" color="neon">
              Convite
            </AppText>
            <AppText variant="h2" style={styles.title}>
              Vincular profissional
            </AppText>

            {/* Card NEUTRO — nome real quando GET /invites/:code/preview existir. */}
            <Card padding="md" style={styles.inviterCardExtra}>
              <View style={styles.inviterIcon}>
                <UserCircle size={26} weight="duotone" color={colors.neon} />
              </View>
              <View style={styles.inviterInfo}>
                <AppText variant="h4">Convite de profissional</AppText>
                <AppText variant="bodySm" color="tertiary">
                  Confirmamos quem te convidou ao criar o vínculo.
                </AppText>
              </View>
            </Card>

            <Input
              label="Código do convite"
              value={code}
              onChangeText={(t) => {
                if (error) setError(null);
                setCode(t);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.codeInput}
              error={error ?? undefined}
            />

            <View style={styles.cta}>
              <Button
                variant="primary"
                label="Confirmar vínculo"
                disabled={code.trim().length === 0 || consume.isPending}
                loading={consume.isPending}
                onPress={handleConfirm}
              />
            </View>
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: { flex: 1, backgroundColor: theme.colors.bgLowest },
  flex: { flex: 1 },
  topbar: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm },
  body: { flex: 1, padding: theme.spacing.lg, gap: theme.spacing.md },
  centerWrap: {
    flex: 1,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    justifyContent: 'center',
  },
  title: { marginTop: theme.spacing.xs },
  note: { marginBottom: theme.spacing.md },
  inviterCardExtra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  inviterIcon: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviterInfo: { flex: 1, gap: 2 },
  // Código em fonte mono, espelhando o input de convite do cadastro antigo.
  codeInput: { fontFamily: theme.fontFamily.mono, letterSpacing: 1 },
  cta: { marginTop: theme.spacing.md },
}));
