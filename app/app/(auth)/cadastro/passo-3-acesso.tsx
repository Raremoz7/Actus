import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text as RNText,
  View,
} from 'react-native';
import { Controller, useFormContext } from 'react-hook-form';
import { router } from 'expo-router';
import { Check } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Button, Input, ScreenHero } from '@/components/ui';
import { FormErrorBanner, MaskedField, WizardProgress } from '@/components/molecules';
import { useRegisterMutation } from '@/features/auth/hooks';
import { authErrorMessage } from '@/features/auth/errors';
import { useCadastroDraftStore } from '@/store/cadastroDraftStore';
import { isApiError } from '@/api/errors';
import {
  buildRegisterBody,
  routeRegisterError,
  type CadastroForm,
} from '@/features/auth/cadastroForm';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

// Tamanho mínimo da senha — espelha CadastroFormSchema.password (min 8).
const MIN_PASSWORD = 8;

// [ASSET TEMPORÁRIO] placeholder Unsplash até as fotos curadas chegarem.
const PASSO3_PHOTO = {
  uri: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=1080&q=70&auto=format&fit=crop',
};

// [ajuste: definir URLs reais de termos de uso / política de privacidade]
const TERMS_URL = 'https://actus.fit/termos';
const PRIVACY_URL = 'https://actus.fit/privacidade';

export default function Passo3AcessoScreen() {
  const {
    control,
    getValues,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useFormContext<CadastroForm>();

  const clearDraft = useCadastroDraftStore((s) => s.clear);
  const setLastInviteError = useCadastroDraftStore((s) => s.setLastInviteError);
  const setLastCpfError = useCadastroDraftStore((s) => s.setLastCpfError);

  const mutation = useRegisterMutation();

  // Banner form-level (erro genérico/rede).
  const [formError, setFormError] = useState<string | null>(null);
  // Consentimento LGPD: gate local. buildRegisterBody envia lgpd_consent: true,
  // mas o envio só acontece com o checkbox marcado.
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);

  // Requisito visível da senha (mín. 8) — reativo via watch.
  const passwordValue = watch('password');
  const passwordMeetsLength = passwordValue.length >= MIN_PASSWORD;

  function handleApiError(err: unknown) {
    if (!isApiError(err)) {
      setFormError(authErrorMessage('unknown'));
      return;
    }

    const route = routeRegisterError(err.code, err.extras);

    // Passo 1 — convite inválido: grava o erro no draft store e volta ao passo 1.
    if (route.passo === 1) {
      setLastInviteError(err.code);
      router.dismissTo('/(auth)/cadastro/passo-1-convite');
      return;
    }

    // Passo 2 — CPF já em uso: guarda a mensagem e volta ao passo 2 (que aplica ao montar).
    if (route.passo === 2) {
      setLastCpfError(route.fieldMessage ?? authErrorMessage(err.code));
      router.dismissTo('/(auth)/cadastro/passo-2-voce');
      return;
    }

    // Passo 3 — fica aqui.
    if (route.formLevel) {
      setFormError(authErrorMessage(err.code));
      return;
    }

    if (route.campo) {
      const message = route.fieldMessage ?? authErrorMessage(err.code);
      setError(route.campo, { message });
    } else {
      setFormError(authErrorMessage(err.code));
    }
  }

  function handleCreate() {
    setFormError(null);

    const values = getValues();

    // Confirmação de senha: bloqueia o envio se não conferir (passo 3 não roda zod).
    if (values.password !== values.confirm_password) {
      setError('confirm_password', { message: 'As senhas não conferem.' });
      return;
    }

    // Consentimento obrigatório para criar a conta.
    if (!consent) {
      setConsentError(true);
      return;
    }

    const body = buildRegisterBody(values);
    mutation.mutate(body, {
      onSuccess: () => {
        // O store já fez tokens → /me → status; o index.tsx despacha por tipo.
        clearDraft();
        router.replace('/');
      },
      onError: handleApiError,
    });
  }

  function toggleConsent() {
    setConsent((v) => !v);
    setConsentError(false);
  }

  // Editar senha/confirmação limpa o erro de "não conferem".
  function clearConfirmError() {
    if (errors.confirm_password) clearErrors('confirm_password');
  }

  return (
    <View style={styles.root}>
      <ScreenHero
        photo={PASSO3_PHOTO}
        eyebrow="Passo 03 / Acesso"
        title="Seu acesso"
        titleSize={28}
        compact
        onBack={() => router.back()}
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
            <WizardProgress total={3} current={3} />
          </View>

          {formError ? (
            <View style={styles.banner}>
              <FormErrorBanner message={formError} />
            </View>
          ) : null}

          <View style={styles.form}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="E-mail"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="next"
                  accessibilityLabel="E-mail"
                  error={errors.email?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, value } }) => (
                <MaskedField
                  label="Telefone · opcional"
                  mask="phone"
                  value={value}
                  onChangeText={onChange}
                  returnKeyType="next"
                  error={errors.phone?.message}
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
                    value={value}
                    onChangeText={(text) => {
                      clearConfirmError();
                      onChange(text);
                    }}
                    onBlur={onBlur}
                    secureToggle
                    autoCapitalize="none"
                    autoComplete="password-new"
                    textContentType="newPassword"
                    returnKeyType="next"
                    accessibilityLabel="Senha"
                    error={errors.password?.message}
                  />
                )}
              />
              <AppText
                variant="metaSmall"
                color={passwordMeetsLength ? 'neon' : 'tertiary'}
                uppercase
                style={styles.hint}
              >
                {passwordMeetsLength ? '✓ 8+ caracteres' : 'Mínimo de 8 caracteres'}
              </AppText>
            </View>

            <Controller
              control={control}
              name="confirm_password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Confirmar senha"
                  value={value}
                  onChangeText={(text) => {
                    clearConfirmError();
                    onChange(text);
                  }}
                  onBlur={onBlur}
                  secureToggle
                  autoCapitalize="none"
                  autoComplete="password-new"
                  textContentType="newPassword"
                  returnKeyType="go"
                  onSubmitEditing={handleCreate}
                  accessibilityLabel="Confirmar senha"
                  error={errors.confirm_password?.message}
                />
              )}
            />
          </View>

          {/* Consentimento LGPD: checkbox + termos/privacidade tocáveis. */}
          <View style={styles.consent}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: consent }}
              accessibilityLabel="Li e aceito os termos de uso e a política de privacidade"
              hitSlop={8}
              onPress={toggleConsent}
              style={[
                styles.checkbox,
                consent ? styles.checkboxChecked : null,
                consentError ? styles.checkboxError : null,
              ]}
            >
              {consent ? (
                <Check size={14} weight="bold" color={colors.textInverse} />
              ) : null}
            </Pressable>

            <AppText variant="bodySm" color="tertiary" style={styles.consentText}>
              Li e aceito os{' '}
              <RNText
                style={styles.consentLink}
                onPress={() => void Linking.openURL(TERMS_URL)}
              >
                termos de uso
              </RNText>{' '}
              e a{' '}
              <RNText
                style={styles.consentLink}
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

          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Já tenho conta, entrar"
            hitSlop={8}
            onPress={() => router.replace('/(auth)/login')}
            style={styles.footer}
          >
            <AppText variant="bodySm" color="secondary" style={styles.footerText}>
              Já tem conta?{' '}
              <AppText variant="bodySm" color="neon" style={styles.footerLink}>
                Entrar
              </AppText>
            </AppText>
          </Pressable>
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
    marginBottom: theme.spacing.md,
  },
  form: {
    gap: theme.spacing.lg,
  },
  field: {
    alignSelf: 'stretch',
  },
  hint: {
    marginTop: theme.spacing.xs,
    marginLeft: 2,
    letterSpacing: 1,
  },
  consent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
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
  checkboxChecked: {
    backgroundColor: theme.colors.neon,
    borderColor: theme.colors.neon,
  },
  checkboxError: {
    borderColor: theme.colors.error,
  },
  consentText: {
    flex: 1,
  },
  consentLink: {
    color: theme.colors.neon,
    fontFamily: theme.fontFamily.bodySemiBold,
  },
  consentErrorText: {
    marginTop: theme.spacing.xs,
    marginLeft: 30,
  },
  cta: {
    marginTop: theme.spacing.xl,
  },
  footer: {
    alignSelf: 'center',
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.xs,
  },
  footerText: {
    textAlign: 'center',
  },
  footerLink: {
    fontFamily: theme.fontFamily.bodySemiBold,
  },
}));
