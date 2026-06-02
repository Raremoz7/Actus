import { useEffect } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { WarningCircle } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Button, Input, Logo, Screen } from '@/components/ui';
import { LoginBodySchema, type LoginBody } from '@/types/auth';
import { useLoginMutation } from '@/features/auth/hooks';
import { authErrorMessage } from '@/features/auth/errors';
import { isApiError } from '@/api/errors';
import { darkTheme } from '@/theme';

const { motion, colors } = darkTheme;

// [fluxo futuro] sem reset de senha na API v1 — não há link "Esqueci a senha".

// Resolve a mensagem de erro a partir do ApiError.code (campo "error" do backend),
// NUNCA pelo HTTP status. invalid_credentials/invalid_body → credenciais; network_error → conexão.
function loginErrorMessage(err: unknown): string {
  if (isApiError(err)) {
    if (err.code === 'network_error') return 'Sem conexão com o servidor.';
    return authErrorMessage(err.code);
  }
  return authErrorMessage('unknown');
}

// O banner de erro aparece SEM animação (sem shake, sem alarme) — borda error radius 4.
function FormErrorBanner({ message }: { message: string }) {
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <WarningCircle size={18} weight="duotone" color={colors.error} />
      <AppText variant="bodySm" color="onSurface" style={styles.bannerText}>
        {message}
      </AppText>
    </View>
  );
}

export default function LoginScreen() {
  const mutation = useLoginMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginBody>({
    resolver: zodResolver(LoginBodySchema),
    defaultValues: { email: '', password: '' },
    mode: 'onSubmit',
  });

  // ÚNICA animação da tela: reveal de entrada (opacity 0→1 + translateY sutil, 300ms).
  const revealOpacity = useSharedValue(0);
  const revealTranslate = useSharedValue(12);

  useEffect(() => {
    revealOpacity.value = withTiming(1, { duration: motion.screenMs });
    revealTranslate.value = withTiming(0, { duration: motion.screenMs });
  }, [revealOpacity, revealTranslate]);

  const revealStyle = useAnimatedStyle(() => ({
    opacity: revealOpacity.value,
    transform: [{ translateY: revealTranslate.value }],
  }));

  // Erro de credencial/validação vindo da API marca os DOIS campos e o banner.
  const apiErrorMessage = mutation.isError ? loginErrorMessage(mutation.error) : null;
  const credentialError =
    isApiError(mutation.error) &&
    (mutation.error.code === 'invalid_credentials' || mutation.error.code === 'invalid_body');
  const fieldsHaveApiError = mutation.isError && credentialError;

  function onSubmit(values: LoginBody) {
    mutation.mutate(values, {
      // Sucesso: o store já roteia (transação tokens → /me → status); o index.tsx
      // despacha pelo tipo. Mantemos o replace como rede de segurança.
      onSuccess: () => {
        router.replace('/');
      },
    });
  }

  return (
    <Screen padded>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View style={[styles.flex, revealStyle]}>
          <Logo variant="symbol" color="neon" width={30} />

          <View style={styles.header}>
            <AppText variant="eyebrow" color="tertiary">
              Acesso
            </AppText>
            <AppText variant="h1" style={styles.title}>
              Entrar
            </AppText>
          </View>

          {apiErrorMessage ? <FormErrorBanner message={apiErrorMessage} /> : null}

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
                  error={
                    errors.email
                      ? 'Informe um e-mail válido.'
                      : fieldsHaveApiError
                        ? ' '
                        : undefined
                  }
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
                  autoComplete="password"
                  textContentType="password"
                  returnKeyType="go"
                  onSubmitEditing={handleSubmit(onSubmit)}
                  accessibilityLabel="Senha"
                  error={
                    errors.password
                      ? 'Informe sua senha.'
                      : fieldsHaveApiError
                        ? ' '
                        : undefined
                  }
                />
              )}
            />

            <View style={styles.cta}>
              <Button
                variant="primary"
                label="Entrar"
                loading={mutation.isPending}
                onPress={handleSubmit(onSubmit)}
              />
            </View>
          </View>

          <View style={styles.footer}>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Recebi um convite, criar conta"
              hitSlop={8}
              onPress={() => router.push('/(auth)/cadastro')}
            >
              <AppText variant="bodyMd" color="secondary" style={styles.footerText}>
                Recebi um convite ·{' '}
                <AppText variant="bodyMd" color="neon" style={styles.footerLink}>
                  Criar conta
                </AppText>
              </AppText>
            </Pressable>
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
  header: {
    marginTop: theme.spacing.xxl,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: 44,
    lineHeight: 44,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.error,
    borderRadius: theme.radius.card,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  bannerText: {
    flex: 1,
  },
  form: {
    gap: theme.spacing.lg,
  },
  cta: {
    marginTop: theme.spacing.xs,
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingTop: theme.spacing.xl,
  },
  footerText: {
    textAlign: 'center',
  },
  footerLink: {
    fontFamily: theme.fontFamily.bodySemiBold,
  },
}));
