import { useEffect } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { router, Stack } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Input, Button, Screen } from '@/components/ui';
import { FormErrorBanner } from '@/components/molecules';
import { useChangePasswordMutation } from '@/features/auth/hooks';
import { isApiError } from '@/api/errors';
import { darkTheme } from '@/theme';

const { motion } = darkTheme;

// Tamanho mínimo da nova senha — espelha ChangePasswordBodySchema (new_password >= 8).
const MIN_NEW_PASSWORD = 8;

// Form local: além dos campos da API, há "confirmar" (validação 100% local).
// A regra de match vive aqui no schema do form; o body enviado é só { current, new }.
const TrocarSenhaFormSchema = z
  .object({
    current_password: z.string().min(1, 'Informe a senha provisória.'),
    new_password: z
      .string()
      .min(MIN_NEW_PASSWORD, 'A nova senha precisa de ao menos 8 caracteres.'),
    confirm_password: z.string().min(1, 'Confirme a nova senha.'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    path: ['confirm_password'],
    message: 'As senhas não conferem.',
  });

type TrocarSenhaForm = z.infer<typeof TrocarSenhaFormSchema>;

export default function TrocarSenhaScreen() {
  const mutation = useChangePasswordMutation();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TrocarSenhaForm>({
    resolver: zodResolver(TrocarSenhaFormSchema),
    defaultValues: { current_password: '', new_password: '', confirm_password: '' },
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

  // Indicador sóbrio do requisito atendido (mockup B): linha mono neon quando >= 8 chars.
  const newPassword = watch('new_password');
  const meetsLength = newPassword.length >= MIN_NEW_PASSWORD;

  // Branch SEMPRE pelo ApiError.code (campo "error" do backend), NUNCA pelo HTTP status:
  // - invalid_credentials → senha provisória não confere (erro no campo atual)
  // - invalid_body        → nova senha fora da regra (erro no campo nova)
  // - internal_error / network_error / desconhecido → banner form-level
  const apiCode = isApiError(mutation.error) ? mutation.error.code : null;
  const currentPasswordApiError =
    apiCode === 'invalid_credentials' ? 'A senha atual não confere.' : undefined;
  const newPasswordApiError =
    apiCode === 'invalid_body'
      ? 'A nova senha precisa de ao menos 8 caracteres.'
      : undefined;
  const bannerMessage =
    mutation.isError && apiCode !== 'invalid_credentials' && apiCode !== 'invalid_body'
      ? 'Não foi possível alterar a senha. Tente de novo.'
      : null;

  function onSubmit(values: TrocarSenhaForm) {
    mutation.mutate(
      {
        current_password: values.current_password,
        new_password: values.new_password,
      },
      {
        // A mutation já chama completePasswordChange() no store (revalida /me e
        // libera o app). O replace é a rede de segurança — o index despacha por tipo.
        onSuccess: () => {
          router.replace('/');
        },
      },
    );
  }

  return (
    <Screen padded>
      {/* Gate: sem voltar (sem botão e sem gesture). Só sai trocando a senha. */}
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View style={[styles.flex, revealStyle]}>
          <View style={styles.header}>
            <AppText variant="eyebrow" color="tertiary">
              Primeiro acesso
            </AppText>
            <AppText variant="h1" style={styles.title}>
              Defina sua{'\n'}senha
            </AppText>
            <AppText variant="bodyMd" color="secondary" style={styles.intro}>
              Sua senha provisória expira agora.
            </AppText>
          </View>

          {bannerMessage ? <FormErrorBanner message={bannerMessage} /> : null}

          <View style={styles.form}>
            <Controller
              control={control}
              name="current_password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Senha provisória"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureToggle
                  autoCapitalize="none"
                  autoComplete="current-password"
                  textContentType="password"
                  returnKeyType="next"
                  accessibilityLabel="Senha provisória"
                  error={errors.current_password?.message ?? currentPasswordApiError}
                />
              )}
            />

            <View style={styles.field}>
              <Controller
                control={control}
                name="new_password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Nova senha"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureToggle
                    autoCapitalize="none"
                    autoComplete="new-password"
                    textContentType="newPassword"
                    returnKeyType="next"
                    accessibilityLabel="Nova senha"
                    error={errors.new_password?.message ?? newPasswordApiError}
                  />
                )}
              />
              {meetsLength ? (
                <AppText variant="metaSmall" color="neon" uppercase style={styles.hint}>
                  ✓ 8+ caracteres
                </AppText>
              ) : null}
            </View>

            <Controller
              control={control}
              name="confirm_password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Confirmar nova senha"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureToggle
                  autoCapitalize="none"
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="go"
                  onSubmitEditing={handleSubmit(onSubmit)}
                  accessibilityLabel="Confirmar nova senha"
                  error={errors.confirm_password?.message}
                />
              )}
            />
          </View>

          <View style={styles.footer}>
            <Button
              variant="primary"
              label="Salvar e entrar"
              loading={mutation.isPending}
              onPress={handleSubmit(onSubmit)}
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
  header: {
    marginTop: theme.spacing.xl,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: 36,
    lineHeight: 36,
  },
  intro: {
    marginTop: theme.spacing.xs,
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
  footer: {
    marginTop: 'auto',
    paddingTop: theme.spacing.xl,
  },
}));
