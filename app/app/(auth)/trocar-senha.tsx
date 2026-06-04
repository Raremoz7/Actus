import { useEffect } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
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

import { AppText, Input, Button, ScreenHero } from '@/components/ui';
import { FormErrorBanner } from '@/components/molecules';
import { useChangePasswordMutation } from '@/features/auth/hooks';
import { isApiError } from '@/api/errors';
import { darkTheme } from '@/theme';

const { motion } = darkTheme;

// [ASSET TEMPORÁRIO] placeholder Unsplash até as fotos curadas chegarem.
const TROCA_PHOTO = {
  uri: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=1080&q=70&auto=format&fit=crop',
};

// Tamanho mínimo da nova senha — espelha ChangePasswordBodySchema (new_password >= 8).
const MIN_NEW_PASSWORD = 8;

// Form local: além dos campos da API, há "confirmar" (validação 100% local).
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

  // ÚNICA animação da tela: entrada do hero (opacity 0→1 + translateY -16→0, 300ms).
  const heroReveal = useSharedValue(0);
  useEffect(() => {
    heroReveal.value = withTiming(1, { duration: motion.screenMs });
  }, [heroReveal]);
  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroReveal.value,
    transform: [{ translateY: (1 - heroReveal.value) * -16 }],
  }));

  const newPassword = watch('new_password');
  const meetsLength = newPassword.length >= MIN_NEW_PASSWORD;

  // Branch SEMPRE pelo ApiError.code (campo "error" do backend), NUNCA pelo HTTP status.
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
        onSuccess: () => {
          router.replace('/');
        },
      },
    );
  }

  return (
    <View style={styles.root}>
      {/* Gate: sem voltar (sem botão e sem gesture). Só sai trocando a senha. */}
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />

      <Animated.View style={heroStyle}>
        <ScreenHero
          photo={TROCA_PHOTO}
          eyebrow="Primeiro acesso"
          title={'Defina sua\nsenha'}
          titleSize={30}
        />
      </Animated.View>

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
          <AppText variant="bodyMd" color="secondary" style={styles.intro}>
            Sua senha provisória expira agora.
          </AppText>

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
  intro: {
    marginBottom: theme.spacing.lg,
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
