import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { Controller, useFormContext } from 'react-hook-form';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Button, Input, Screen } from '@/components/ui';
import { FormErrorBanner, MaskedField } from '@/components/molecules';
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

const { motion } = darkTheme;

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

  // ÚNICA animação da tela: reveal de entrada (300ms).
  const reveal = useSharedValue(0);
  useEffect(() => {
    reveal.value = withTiming(1, { duration: motion.screenMs });
  }, [reveal]);

  const revealStyle = useAnimatedStyle(() => ({
    opacity: reveal.value,
    transform: [{ translateY: (1 - reveal.value) * 12 }],
  }));

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

    const body = buildRegisterBody(getValues());
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
    <Screen scroll>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View style={[styles.flex, revealStyle]}>
          <AppText variant="eyebrow" color="tertiary">
            Passo 3 / Acesso
          </AppText>
          <AppText variant="h2" style={styles.title}>
            Seu acesso
          </AppText>

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
        </Animated.View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  flex: {
    flex: 1,
  },
  title: {
    marginTop: theme.spacing.sm,
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
    paddingBottom: theme.spacing.lg,
  },
}));
