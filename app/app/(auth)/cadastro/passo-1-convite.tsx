import { useEffect } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { Controller, useFormContext } from 'react-hook-form';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Button, Input, Screen } from '@/components/ui';
import { FormErrorBanner } from '@/components/molecules';
import { useCadastroDraftStore } from '@/store/cadastroDraftStore';
import { authErrorMessage } from '@/features/auth/errors';
import {
  type CadastroForm,
  PASSO_1_FIELDS,
} from '@/features/auth/cadastroForm';
import { darkTheme } from '@/theme';

const { motion } = darkTheme;

// [MOCK — sem endpoint na API v1: GET /invites/:code/preview]
// O nome de quem convidou não existe na API. Card exibido com dado falso até o endpoint existir.
const MOCK_INVITER = {
  initials: 'CM',
  name: 'Carlos Mendes',
  role: 'Personal Trainer · convidou você',
} as const;

export default function Passo1ConviteScreen() {
  const {
    control,
    trigger,
    formState: { errors },
  } = useFormContext<CadastroForm>();

  const inviteFromLink = useCadastroDraftStore((s) => s.inviteCode);
  const lastInviteError = useCadastroDraftStore((s) => s.lastInviteError);
  const setLastInviteError = useCadastroDraftStore((s) => s.setLastInviteError);

  // ÚNICA animação da tela: reveal de entrada (300ms).
  const reveal = useSharedValue(0);
  useEffect(() => {
    reveal.value = withTiming(1, { duration: motion.screenMs });
  }, [reveal]);

  const revealStyle = useAnimatedStyle(() => ({
    opacity: reveal.value,
    transform: [{ translateY: (1 - reveal.value) * 12 }],
  }));

  const inviteError = lastInviteError ? authErrorMessage(lastInviteError) : null;

  async function handleContinue() {
    const ok = await trigger([...PASSO_1_FIELDS]);
    if (ok) {
      router.push('/(auth)/cadastro/passo-2-voce');
    }
  }

  const fieldErrorMessage = errors.invite_code?.message;

  return (
    <Screen scroll>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View style={[styles.flex, revealStyle]}>
          <AppText variant="eyebrow" color="tertiary">
            Passo 1 / Convite
          </AppText>
          <AppText variant="h2" style={styles.title}>
            Seu convite
          </AppText>

          {inviteError ? (
            <View style={styles.banner}>
              <FormErrorBanner message={inviteError} />
            </View>
          ) : null}

          {/* Card do convidador — dado MOCK (ver comentário no topo). */}
          <View style={styles.inviterCard}>
            <View style={styles.avatar}>
              <AppText variant="h3" color="neon">
                {MOCK_INVITER.initials}
              </AppText>
            </View>
            <View style={styles.inviterInfo}>
              <AppText variant="h3" style={styles.inviterName}>
                {MOCK_INVITER.name}
              </AppText>
              <AppText variant="bodySm" color="tertiary">
                {MOCK_INVITER.role}
              </AppText>
            </View>
          </View>

          {__DEV__ ? (
            <View style={styles.mockBadge}>
              <AppText variant="metaSmall" style={styles.mockText}>
                Demonstração — dado mock
              </AppText>
            </View>
          ) : null}

          <View style={styles.field}>
            <Controller
              control={control}
              name="invite_code"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Código do convite"
                  value={value}
                  onChangeText={(text) => {
                    // Editar o campo limpa o erro de convite vindo da rede.
                    if (lastInviteError) setLastInviteError(null);
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
            <AppText variant="metaSmall" color="tertiary" style={styles.fromLink}>
              ✓ Código recebido pelo link
            </AppText>
          ) : null}

          <AppText variant="bodySm" color="tertiary" style={styles.helper}>
            O vínculo com seu personal é confirmado ao criar a conta.
          </AppText>

          <View style={styles.cta}>
            <Button variant="primary" label="Continuar" onPress={handleContinue} />
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
    marginBottom: theme.spacing.sm,
  },
  avatar: {
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
  inviterName: {
    fontSize: 15,
  },
  mockBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.warning,
    borderRadius: theme.radius.tag,
    paddingVertical: 3,
    paddingHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  mockText: {
    fontSize: 8,
    letterSpacing: 1.6,
    color: theme.colors.warning,
  },
  field: {
    alignSelf: 'stretch',
  },
  codeInput: {
    fontFamily: theme.fontFamily.mono,
    letterSpacing: 1,
  },
  fromLink: {
    marginTop: theme.spacing.sm,
    letterSpacing: 1,
  },
  helper: {
    marginTop: theme.spacing.md,
  },
  cta: {
    marginTop: 'auto',
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },
}));
