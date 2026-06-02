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

import { AppText, Button, Screen } from '@/components/ui';
import {
  DateField,
  FormField,
  GenderChips,
  MaskedField,
} from '@/components/molecules';
import { useCadastroDraftStore } from '@/store/cadastroDraftStore';
import {
  type CadastroForm,
  PASSO_2_FIELDS,
} from '@/features/auth/cadastroForm';
import type { Gender } from '@/types/auth';
import { darkTheme } from '@/theme';

const { motion } = darkTheme;

export default function Passo2VoceScreen() {
  const {
    control,
    trigger,
    setError,
    formState: { errors },
  } = useFormContext<CadastroForm>();

  const lastCpfError = useCadastroDraftStore((s) => s.lastCpfError);
  const setLastCpfError = useCadastroDraftStore((s) => s.setLastCpfError);

  // Erro de CPF já-em-uso vindo do register (passo 3): aplica ao remontar este passo.
  useEffect(() => {
    if (lastCpfError) {
      setError('cpf', { message: lastCpfError });
      setLastCpfError(null);
    }
  }, [lastCpfError, setError, setLastCpfError]);

  // ÚNICA animação da tela: reveal de entrada (300ms).
  const reveal = useSharedValue(0);
  useEffect(() => {
    reveal.value = withTiming(1, { duration: motion.screenMs });
  }, [reveal]);

  const revealStyle = useAnimatedStyle(() => ({
    opacity: reveal.value,
    transform: [{ translateY: (1 - reveal.value) * 12 }],
  }));

  async function handleContinue() {
    const ok = await trigger([...PASSO_2_FIELDS]);
    if (ok) {
      router.push('/(auth)/cadastro/passo-3-acesso');
    }
  }

  return (
    <Screen scroll>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View style={[styles.flex, revealStyle]}>
          <AppText variant="eyebrow" color="tertiary">
            Passo 2 / Você
          </AppText>
          <AppText variant="h2" style={styles.title}>
            Quem treina
          </AppText>

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
              name="birth_date"
              render={({ field: { onChange, value } }) => (
                <DateField
                  label="Nascimento"
                  value={value === '' ? null : value}
                  onChange={onChange}
                  error={errors.birth_date?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="gender"
              render={({ field: { onChange, value } }) => (
                <GenderChips
                  label="Gênero · opcional"
                  value={value === '' || value === undefined ? undefined : value}
                  onChange={(g: Gender) => onChange(g)}
                />
              )}
            />

            <Controller
              control={control}
              name="cpf"
              render={({ field: { onChange, value } }) => (
                <MaskedField
                  label="CPF · opcional"
                  mask="cpf"
                  value={value}
                  onChangeText={(digits) => {
                    if (lastCpfError) setLastCpfError(null);
                    onChange(digits);
                  }}
                  returnKeyType="done"
                  error={errors.cpf?.message}
                />
              )}
            />
          </View>

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
  form: {
    gap: theme.spacing.lg,
  },
  cta: {
    marginTop: 'auto',
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },
}));
