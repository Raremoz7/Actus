import { useEffect } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from '@/navigation';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Button, Input, ScreenHero } from '@/components/ui';
import { FormErrorBanner } from '@/components/molecules';
import { LoginBodySchema, type LoginBody } from '@/types/auth';
import { useLoginMutation } from '@/features/auth/hooks';
import { authErrorMessage } from '@/features/auth/errors';
import { isApiError } from '@/api/errors';
import { goBackOr } from '@/lib/nav';
import { darkTheme } from '@/theme';

const { motion, spacing } = darkTheme;

// [ASSET TEMPORÁRIO] placeholder Unsplash até as fotos curadas chegarem.
const LOGIN_PHOTO = {
  uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1080&q=70&auto=format&fit=crop',
};

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

export default function LoginScreen() {
  const mutation = useLoginMutation();
  const insets = useSafeAreaInsets();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginBody>({
    resolver: zodResolver(LoginBodySchema),
    defaultValues: { email: '', password: '' },
    mode: 'onSubmit',
  });

  // ÚNICA animação da tela: entrada do hero (opacity 0→1 + translateY -16→0, 300ms).
  const heroReveal = useSharedValue(0);
  useEffect(() => {
    heroReveal.value = withTiming(1, { duration: motion.screenMs });
  }, [heroReveal]);
  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroReveal.value,
    transform: [{ translateY: (1 - heroReveal.value) * -16 }],
  }));

  // Erro de credencial/validação vindo da API marca os DOIS campos e o banner.
  const apiErrorMessage = mutation.isError ? loginErrorMessage(mutation.error) : null;
  const credentialError =
    isApiError(mutation.error) &&
    (mutation.error.code === 'invalid_credentials' || mutation.error.code === 'invalid_body');
  const fieldsHaveApiError = mutation.isError && credentialError;

  function onSubmit(values: LoginBody) {
    mutation.mutate(values, {
      onSuccess: () => {
        router.replace('/');
      },
    });
  }

  return (
    <View style={styles.root}>
      <Animated.View style={heroStyle}>
        <ScreenHero
          photo={LOGIN_PHOTO}
          eyebrow="Acesso"
          title="Entrar"
          titleSize={44}
          onBack={() => goBackOr('/(auth)/escolha-perfil')}
        />
      </Animated.View>

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
          {apiErrorMessage ? (
            <View style={styles.banner}>
              <FormErrorBanner message={apiErrorMessage} />
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
                  error={errors.email ? 'Informe um e-mail válido.' : undefined}
                  invalid={fieldsHaveApiError}
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
                  error={errors.password ? 'Informe sua senha.' : undefined}
                  invalid={fieldsHaveApiError}
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
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },
  banner: {
    marginBottom: theme.spacing.lg,
  },
  form: {
    gap: theme.spacing.lg,
  },
  cta: {
    marginTop: theme.spacing.xs,
  },
  footer: {
    alignItems: 'center',
    paddingTop: theme.spacing.lg,
  },
  footerText: {
    textAlign: 'center',
  },
  footerLink: {
    fontFamily: theme.fontFamily.bodySemiBold,
  },
}));
