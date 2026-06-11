// Vínculo com o profissional. Quem registrou COM convite já está vinculado (o register
// real cria o vínculo) — aqui é o reconhecimento visual da história ("Você foi
// convidado por…", nome real quando o preview existir). Sem convite: código manual
// (consume REAL) ou seguir sem vínculo.
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { UserCircle } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Input } from '@/components/ui';
import { OnboardingScreen } from '@/components/onboarding';
import { useAuthStore } from '@/store/authStore';
import { useCadastroDraftStore } from '@/store/cadastroDraftStore';
import { useConsumeInvite } from '@/hooks/useConsumeInvite';
import { useInvitePreview } from '@/hooks/useInvitePreview';
import { authErrorMessage } from '@/features/auth/errors';
import { isApiError } from '@/api/errors';
import { saveStudentAnswers } from '@/mocks/studentOnboarding';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

const CODE_RE = /^[A-Za-z0-9_-]{3,200}$/;
const NEXT = '/onboarding-aluno/par-q';

export default function VinculoScreen() {
  const user = useAuthStore((s) => s.user);
  // O code do deep link sobrevive no draft até aqui (o register não limpa mais).
  const inviteCode = useCadastroDraftStore((s) => s.inviteCode);
  const clearDraft = useCadastroDraftStore((s) => s.clear);
  const consume = useConsumeInvite();
  const preview = useInvitePreview();

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const invited = Boolean(inviteCode);

  // Deep link: resolve o convidador no card já na montagem ("Você foi convidado
  // por…"). Fire-and-forget; sem endpoint/erro o card degrada para o copy neutro.
  useEffect(() => {
    if (inviteCode) preview.mutate(inviteCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inviterName = preview.data?.professional_display_name ?? null;

  async function markAndGo(link: 'invited' | 'linked' | 'none') {
    if (user) await saveStudentAnswers(user.id, { link_status: link });
    clearDraft();
    router.push(NEXT);
  }

  function confirmInvited() {
    void markAndGo('invited');
  }

  function confirmManual() {
    setError(null);
    const trimmed = code.trim();
    if (!CODE_RE.test(trimmed)) {
      setError('Código de convite inválido.');
      return;
    }
    consume.mutate(trimmed, {
      onSuccess: () => void markAndGo('linked'),
      onError: (err) => {
        if (isApiError(err) && err.code === 'already_has_active_professional_for_role') {
          setError('Você já tem um profissional ativo deste tipo. Fale com ele antes de trocar.');
          return;
        }
        setError(isApiError(err) ? authErrorMessage(err.code) : authErrorMessage('unknown'));
      },
    });
  }

  return (
    <OnboardingScreen
      step={2}
      total={8}
      title={invited ? 'Confirme seu vínculo' : 'Você tem um convite?'}
      subtitle={
        invited
          ? 'Seu personal te convidou — confirme para ele acompanhar seu treino.'
          : 'Cole o código do convite ou siga sem vínculo por enquanto.'
      }
      ctaLabel="Confirmar vínculo"
      ctaDisabled={!invited && code.trim().length === 0}
      ctaLoading={consume.isPending}
      onCta={invited ? confirmInvited : confirmManual}
      skipLabel={invited ? undefined : 'Seguir sem vínculo'}
      onSkip={invited ? undefined : () => void markAndGo('none')}
    >
      <View style={styles.card}>
        <View style={styles.icon}>
          <UserCircle size={26} weight="duotone" color={colors.neon} />
        </View>
        <View style={styles.info}>
          <AppText variant="h4">{inviterName ?? 'Convite de profissional'}</AppText>
          <AppText variant="bodySm" color="tertiary">
            {invited
              ? inviterName
                ? 'Você foi convidado por este profissional.'
                : 'Confirmamos quem te convidou ao criar a conta.'
              : 'O vínculo deixa seu treino visível para o profissional.'}
          </AppText>
        </View>
      </View>

      {!invited ? (
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
      ) : null}
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 2 },
  codeInput: { fontFamily: theme.fontFamily.mono, letterSpacing: 1 },
}));
