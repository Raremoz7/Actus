import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { Controller, useFormContext } from 'react-hook-form';
import { router } from 'expo-router';
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

// [ASSET TEMPORÁRIO] placeholder Unsplash até as fotos curadas chegarem.
const PASSO3_PHOTO = {
  uri: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=1080&q=70&auto=format&fit=crop',
};

export default function Passo3AcessoScreen() {
  const {
    control,
    getValues,
    setError,
    formState: { errors },
  } = useFormContext<CadastroForm>();

  const clearDraft = useCadastroDraftStore((s) => s.clear);
  const setLastInviteError = useCadastroDraftStore((s) => s.setLastInviteError);
  const setLastCpfError = useCadastroDraftStore((s) => s.setLastCpfError);

  const mutation = useRegisterMutation();

  // Banner form-level (erro genérico/rede); o e-mail já-em-uso oferece link "Entrar".
  const [formError, setFormError] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);

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
      if (route.campo === 'email' && err.code === 'email_already_in_use') {
        setEmailTaken(true);
      }
    } else {
      setFormError(authErrorMessage(err.code));
    }
  }

  function handleCreate() {
    setFormError(null);
    setEmailTaken(false);

    const values = getValues();

    // Confirmação de senha: bloqueia o envio se não conferir (passo 3 não roda zod).
    if (values.password !== values.confirm_password) {
      setError('confirm_password', { message: 'As senhas não conferem.' });
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

          {emailTaken ? (
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Já tenho conta, entrar"
              hitSlop={8}
              onPress={() => router.replace('/(auth)/login')}
              style={styles.entrarRow}
            >
              <AppText variant="bodySm" color="secondary">
                Já tem conta?{' '}
                <AppText variant="bodySm" color="neon" style={styles.entrarLink}>
                  Entrar
                </AppText>
              </AppText>
            </Pressable>
          ) : null}

          <View style={styles.form}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="E-mail"
                  value={value}
                  onChangeText={(text) => {
                    if (emailTaken) setEmailTaken(false);
                    onChange(text);
                  }}
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
                  returnKeyType="go"
                  onSubmitEditing={handleCreate}
                  accessibilityLabel="Senha"
                  error={errors.password?.message}
                />
              )}
            />
          </View>

          <AppText variant="bodySm" color="tertiary" style={styles.helper}>
            Ao criar a conta você concorda com os termos de uso e a política de
            privacidade do Actus.
          </AppText>

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
  entrarRow: {
    marginBottom: theme.spacing.lg,
  },
  entrarLink: {
    fontFamily: theme.fontFamily.bodySemiBold,
  },
  form: {
    gap: theme.spacing.lg,
  },
  helper: {
    marginTop: theme.spacing.lg,
  },
  cta: {
    marginTop: 'auto',
    paddingTop: theme.spacing.xl,
  },
}));
