// Conta do professor (personal) — tela única, fiel ao PDF de onboarding: nome,
// telefone, e-mail, senha. Perfil profissional (nome/área/CREF) vem DEPOIS, no
// onboarding. Submit → POST /auth/register-professional [pendente no backend;
// devMocks responde em dev].
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
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from '@/navigation';
import { Check } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Button, Input, ScreenHero } from '@/components/ui';
import { FormErrorBanner, FormField, MaskedField } from '@/components/molecules';
import { useRegisterProfessionalMutation } from '@/features/auth/hooks';
import { authErrorMessage } from '@/features/auth/errors';
import { isApiError } from '@/api/errors';
import {
  ContaProfessorFormSchema,
  contaProfessorDefaults,
  buildProfessorRegisterBody,
  registerErrorField,
  type ContaProfessorForm,
} from '@/features/auth/contaForm';
import { goBackOr } from '@/lib/nav';
import { darkTheme } from '@/theme';

const { colors, spacing } = darkTheme;

const MIN_PASSWORD = 8;

// [ASSET TEMPORÁRIO] placeholder Unsplash até as fotos curadas chegarem.
const CONTA_PHOTO = {
  uri: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1080&q=70&auto=format&fit=crop',
};

// [ajuste: definir URLs reais de termos de uso / política de privacidade]
const TERMS_URL = 'https://actus.fit/termos';
const PRIVACY_URL = 'https://actus.fit/privacidade';

export default function CadastroProScreen() {
  const mutation = useRegisterProfessionalMutation();
  const insets = useSafeAreaInsets();

  const {
    control,
    getValues,
    watch,
    setError,
    formState: { errors },
  } = useForm<ContaProfessorForm>({
    resolver: zodResolver(ContaProfessorFormSchema),
    defaultValues: contaProfessorDefaults,
    mode: 'onSubmit',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);

  const passwordValue = watch('password');
  const passwordMeetsLength = passwordValue.length >= MIN_PASSWORD;

  function toggleConsent() {
    setConsent((c) => !c);
    setConsentError(false);
  }

  function handleApiError(err: unknown) {
    if (!isApiError(err)) {
      setFormError(authErrorMessage('unknown'));
      return;
    }
    const target = registerErrorField(err.code, err.extras);
    if (target.campo && target.campo !== 'birth_date' && target.campo !== 'invite_code') {
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
    mutation.mutate(buildProfessorRegisterBody(values), {
      onSuccess: () => {
        // Dispatch decide: onboarding pendente → /onboarding-professor/foto.
        router.replace('/');
      },
      onError: handleApiError,
    });
  }

  return (
    <View style={styles.root}>
      <ScreenHero
        photo={CONTA_PHOTO}
        eyebrow="Sou professor"
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
          <FormErrorBanner message={formError} />

          <View style={styles.form}>
            <FormField
              control={control}
              name="full_name"
              label="Nome completo"
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
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="next"
              error={errors.email?.message}
            />

            <View style={styles.field}>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Senha"
                    value={value}
                    onChangeText={onChange}
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
                  value={value}
                  onChangeText={onChange}
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

          {/* Consentimento LGPD. */}
          <View style={styles.consent}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: consent }}
              accessibilityLabel="Li e aceito os termos de uso e a política de privacidade"
              hitSlop={11}
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
