// Conta do aluno — tela ÚNICA (história de onboarding: nome, telefone, e-mail, senha;
// nascimento mantido por exigência do backend real; convite vem do deep link).
// Com invite_code → register REAL com vínculo automático. Sem → contrato proposto
// [pendente no backend: invite_code opcional]; em dev o devMocks responde.
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text as RNText,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@/navigation';
import { Check, CheckCircle } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Button, Input, ScreenHero } from '@/components/ui';
import { DateField, FormErrorBanner, FormField, MaskedField } from '@/components/molecules';
import { useRegisterMutation } from '@/features/auth/hooks';
import { authErrorMessage } from '@/features/auth/errors';
import { useCadastroDraftStore } from '@/store/cadastroDraftStore';
import { isApiError } from '@/api/errors';
import {
  ContaAlunoFormSchema,
  contaAlunoDefaults,
  buildAlunoRegisterBody,
  registerErrorField,
  type ContaAlunoForm,
} from '@/features/auth/contaForm';
import { goBackOr } from '@/lib/nav';
import { darkTheme } from '@/theme';

const { colors, spacing } = darkTheme;

const MIN_PASSWORD = 8;

// [ASSET TEMPORÁRIO] placeholder Unsplash até as fotos curadas chegarem.
const CONTA_PHOTO = {
  uri: 'https://images.unsplash.com/photo-1546483875-ad9014c88eba?w=1080&q=70&auto=format&fit=crop',
};

// [ajuste: definir URLs reais de termos de uso / política de privacidade]
const TERMS_URL = 'https://actus.fit/termos';
const PRIVACY_URL = 'https://actus.fit/privacidade';

export default function ContaAlunoScreen() {
  const inviteCode = useCadastroDraftStore((s) => s.inviteCode);
  const mutation = useRegisterMutation();
  const insets = useSafeAreaInsets();

  const {
    control,
    getValues,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<ContaAlunoForm>({
    resolver: zodResolver(ContaAlunoFormSchema),
    defaultValues: contaAlunoDefaults,
    mode: 'onSubmit',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);

  // invite_code do deep link: injeta UMA vez ao montar.
  useEffect(() => {
    if (inviteCode) setValue('invite_code', inviteCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const passwordValue = watch('password');
  const passwordMeetsLength = passwordValue.length >= MIN_PASSWORD;
  const hasInvite = Boolean(inviteCode);

  function toggleConsent() {
    setConsent((c) => !c);
    setConsentError(false);
  }

  function handleApiError(err: unknown) {
    if (!isApiError(err)) {
      // Erro fora da camada de API (ex.: parse zod da resposta, erro JS inesperado).
      // O usuário vê a mensagem genérica, mas logamos o erro cru para diagnóstico no
      // device (Metro/logcat) — é aqui que a causa real do cadastro aparece. (TEC-84)
      console.warn('[cadastro] erro não-ApiError ao registrar:', err);
      setFormError(authErrorMessage('unknown'));
      return;
    }
    const target = registerErrorField(err.code, err.extras);
    // invite_code não tem input visível nesta tela (vem do deep link) → banner.
    if (target.campo && target.campo !== 'invite_code') {
      setError(target.campo, {
        message: target.fieldMessage ?? authErrorMessage(err.code),
      });
      return;
    }
    setFormError(authErrorMessage(err.code));
  }

  function handleCreate() {
    setFormError(null);
    const values = getValues();
    if (values.password !== values.confirm_password) {
      setError('confirm_password', { message: 'As senhas não conferem.' });
      return;
    }
    if (!consent) {
      setConsentError(true);
      return;
    }
    mutation.mutate(buildAlunoRegisterBody(values), {
      onSuccess: () => {
        // NÃO limpar o draft aqui: o passo de vínculo do onboarding usa o inviteCode
        // para diferenciar "convidado" de "sem vínculo". O clear acontece no fim do
        // onboarding (corpo.tsx) e no markAndGo do vínculo.
        // O dispatch decide: onboarding pendente → /onboarding-aluno/foto.
        router.replace('/');
      },
      onError: handleApiError,
    });
  }

  return (
    <View style={styles.root}>
      <ScreenHero
        photo={CONTA_PHOTO}
        eyebrow="Sou aluno"
        title="Crie sua conta"
        titleSize={28}
        compact
        onBack={() => goBackOr('/(auth)/escolha-perfil')}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, { paddingBottom: spacing.lg + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {hasInvite ? (
            <View style={styles.inviteBadge}>
              <CheckCircle size={16} weight="duotone" color={colors.neon} />
              <AppText variant="metaSmall" color="secondary">
                Código recebido pelo link — seu vínculo é confirmado depois.
              </AppText>
            </View>
          ) : null}

          <FormErrorBanner message={formError} />

          <View style={styles.form}>
            <FormField
              control={control}
              name="full_name"
              label="Nome completo"
              required
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
              error={errors.full_name?.message}
            />

            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, value } }) => (
                <MaskedField
                  label="Telefone"
                  required
                  mask="phone"
                  value={value}
                  onChangeText={onChange}
                  returnKeyType="next"
                  error={errors.phone?.message}
                />
              )}
            />

            <FormField
              control={control}
              name="email"
              label="E-mail"
              required
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="next"
              error={errors.email?.message}
            />

            <Controller
              control={control}
              name="birth_date"
              render={({ field: { onChange, value } }) => (
                <DateField
                  label="Nascimento"
                  required
                  value={value === '' ? null : value}
                  onChange={onChange}
                  error={errors.birth_date?.message}
                />
              )}
            />

            <View style={styles.field}>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Senha"
                    required
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureToggle
                    autoCapitalize="none"
                    autoComplete="password-new"
                    textContentType="newPassword"
                    returnKeyType="next"
                    error={errors.password?.message}
                  />
                )}
              />
              <View style={styles.hint}>
                {passwordMeetsLength ? (
                  <Check size={12} weight="bold" color={colors.neon} />
                ) : null}
                <AppText
                  variant="metaSmall"
                  color={passwordMeetsLength ? 'neon' : 'tertiary'}
                  uppercase
                >
                  {passwordMeetsLength ? '8+ caracteres' : 'Mínimo de 8 caracteres'}
                </AppText>
              </View>
            </View>

            <Controller
              control={control}
              name="confirm_password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Confirmar senha"
                  required
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureToggle
                  autoCapitalize="none"
                  autoComplete="password-new"
                  textContentType="newPassword"
                  returnKeyType="go"
                  onSubmitEditing={handleCreate}
                  error={errors.confirm_password?.message}
                />
              )}
            />
          </View>

          {/* Consentimento LGPD (mesmo padrão do cadastro anterior). */}
          <View style={styles.consent}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: consent }}
              accessibilityLabel="Li e aceito os termos de uso e a política de privacidade"
              hitSlop={16}
              onPress={toggleConsent}
              style={[
                styles.checkbox,
                consent ? styles.checkboxChecked : null,
                consentError ? styles.checkboxError : null,
              ]}
            >
              {consent ? <Check size={14} weight="bold" color={colors.textInverse} /> : null}
            </Pressable>
            <AppText variant="bodySm" color="tertiary" style={styles.consentText}>
              Li e aceito os{' '}
              <RNText
                style={styles.consentLink}
                accessibilityRole="link"
                onPress={() => void Linking.openURL(TERMS_URL)}
              >
                termos de uso
              </RNText>{' '}
              e a{' '}
              <RNText
                style={styles.consentLink}
                accessibilityRole="link"
                onPress={() => void Linking.openURL(PRIVACY_URL)}
              >
                política de privacidade
              </RNText>
              .
            </AppText>
          </View>
          {consentError ? (
            <AppText variant="bodySm" color="error" style={styles.consentErrorText}>
              Aceite os termos para criar a conta.
            </AppText>
          ) : null}

          <View style={styles.cta}>
            <Button
              variant="primary"
              label="Criar conta"
              loading={mutation.isPending}
              onPress={handleCreate}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bgBase },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  inviteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  form: { gap: theme.spacing.lg },
  field: { gap: theme.spacing.xs },
  hint: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  consent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xl,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: theme.radius.tag,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: { backgroundColor: theme.colors.neon, borderColor: theme.colors.neon },
  checkboxError: { borderColor: theme.colors.error },
  consentText: { flex: 1 },
  consentLink: { color: theme.colors.neon, fontFamily: theme.fontFamily.bodySemiBold },
  consentErrorText: { marginTop: theme.spacing.xs, marginLeft: 30 },
  cta: { marginTop: theme.spacing.xl },
}));
