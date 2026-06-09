import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { Controller, useFormContext } from 'react-hook-form';
import { router } from 'expo-router';
import { CheckCircle, UserCircle } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Button, Input, ScreenHero } from '@/components/ui';
import { FormErrorBanner, WizardProgress } from '@/components/molecules';
import { useCadastroDraftStore } from '@/store/cadastroDraftStore';
import { useInvitePreview } from '@/hooks/useInvitePreview';
import { authErrorMessage } from '@/features/auth/errors';
import { isApiError } from '@/api/errors';
import { type CadastroForm, PASSO_1_FIELDS } from '@/features/auth/cadastroForm';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

// Códigos de erro que invalidam o convite — bloqueiam o avanço no passo 1 (os demais
// erros, ex.: endpoint indisponível/rede, degradam e deixam o register validar depois).
const INVITE_ERROR_CODES = new Set([
  'invalid_invite',
  'invite_expired',
  'invite_exhausted',
  'invalid_invite_professional',
]);

// [ASSET TEMPORÁRIO] placeholder Unsplash até as fotos curadas chegarem.
const PASSO1_PHOTO = {
  uri: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1080&q=70&auto=format&fit=crop',
};

// [MOCK — sem endpoint na API v1: GET /invites/:code/preview]
// O nome de quem convidou não existe na API. Enquanto o endpoint não existir,
// exibimos um card NEUTRO e honesto (sem nome/avatar falso). O nome real só
// aparecerá quando GET /invites/:code/preview for implementado.

export default function Passo1ConviteScreen() {
  const {
    control,
    trigger,
    getValues,
    setError,
    clearErrors,
    formState: { errors },
  } = useFormContext<CadastroForm>();

  const inviteFromLink = useCadastroDraftStore((s) => s.inviteCode);
  const lastInviteError = useCadastroDraftStore((s) => s.lastInviteError);
  const setLastInviteError = useCadastroDraftStore((s) => s.setLastInviteError);

  const preview = useInvitePreview();

  const inviteError = lastInviteError ? authErrorMessage(lastInviteError) : null;

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)/escolha-perfil');
    }
  }

  async function handleContinue() {
    // 1) formato (zod) — barra antes de qualquer ida à rede.
    const ok = await trigger([...PASSO_1_FIELDS]);
    if (!ok) return;

    // 2) validação do convite JÁ NO PASSO 1 (não no fim do cadastro): consulta o preview.
    //    Convite inválido/expirado/esgotado → erro inline, sem avançar. Qualquer outro
    //    erro (endpoint pendente no backend, rede) degrada: segue e o register valida.
    const code = getValues('invite_code').trim();
    try {
      await preview.mutateAsync(code);
    } catch (err) {
      if (isApiError(err) && INVITE_ERROR_CODES.has(err.code)) {
        setError('invite_code', { message: authErrorMessage(err.code) });
        return;
      }
    }
    router.push('/(auth)/cadastro/passo-2-voce');
  }

  const fieldErrorMessage = errors.invite_code?.message;

  return (
    <View style={styles.root}>
      <ScreenHero
        photo={PASSO1_PHOTO}
        eyebrow="Passo 01 / Convite"
        title="Seu convite"
        titleSize={28}
        compact
        onBack={handleBack}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.progress}>
            <WizardProgress total={3} current={1} />
          </View>

          {inviteError ? (
            <View style={styles.banner}>
              <FormErrorBanner message={inviteError} />
            </View>
          ) : null}

          {/* Card NEUTRO do convidador — sem nome/avatar falso (ver comentário no topo). */}
          <View style={styles.inviterCard}>
            <View style={styles.inviterIcon}>
              <UserCircle size={26} weight="duotone" color={colors.neon} />
            </View>
            <View style={styles.inviterInfo}>
              <AppText variant="h4">Convite de treinador</AppText>
              <AppText variant="bodySm" color="tertiary">
                Confirmamos quem te convidou ao criar a conta.
              </AppText>
            </View>
          </View>

          <View style={styles.field}>
            <Controller
              control={control}
              name="invite_code"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Código do convite"
                  value={value}
                  onChangeText={(text) => {
                    // Editar o campo limpa os erros de convite (banner da rede + inline da validação).
                    if (lastInviteError) setLastInviteError(null);
                    clearErrors('invite_code');
                    onChange(text);
                  }}
                  onBlur={onBlur}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                  returnKeyType="next"
                  onSubmitEditing={handleContinue}
                  accessibilityLabel="Código do convite"
                  style={styles.codeInput}
                  error={fieldErrorMessage}
                />
              )}
            />
          </View>

          {inviteFromLink ? (
            <View style={styles.fromLink}>
              <CheckCircle size={14} weight="duotone" color={colors.neon} />
              <AppText variant="metaSmall" color="tertiary">
                Código recebido pelo link
              </AppText>
            </View>
          ) : null}

          <AppText variant="bodySm" color="tertiary" style={styles.helper}>
            O vínculo com seu personal é confirmado ao criar a conta.
          </AppText>

          <View style={styles.cta}>
            <Button
              variant="primary"
              label="Usar meu convite"
              loading={preview.isPending}
              onPress={handleContinue}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bgBase,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  progress: {
    marginBottom: theme.spacing.xl,
  },
  banner: {
    marginBottom: theme.spacing.lg,
  },
  inviterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  inviterIcon: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviterInfo: {
    flex: 1,
    gap: 2,
  },
  field: {
    alignSelf: 'stretch',
  },
  codeInput: {
    fontFamily: theme.fontFamily.mono,
    letterSpacing: 1,
  },
  fromLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  helper: {
    marginTop: theme.spacing.md,
  },
  cta: {
    marginTop: theme.spacing.xl,
  },
}));
