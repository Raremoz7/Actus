import { useEffect } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { Controller, useFormContext } from 'react-hook-form';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import { Button, ScreenHero } from '@/components/ui';
import {
  DateField,
  FormField,
  GenderChips,
  MaskedField,
  WizardProgress,
} from '@/components/molecules';
import { useCadastroDraftStore } from '@/store/cadastroDraftStore';
import { type CadastroForm, PASSO_2_FIELDS } from '@/features/auth/cadastroForm';
import type { Gender } from '@/types/auth';

// [ASSET TEMPORÁRIO] placeholder Unsplash até as fotos curadas chegarem.
const PASSO2_PHOTO = {
  uri: 'https://images.unsplash.com/photo-1546483875-ad9014c88eba?w=1080&q=70&auto=format&fit=crop',
};

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

  async function handleContinue() {
    const ok = await trigger([...PASSO_2_FIELDS]);
    if (ok) {
      router.push('/(auth)/cadastro/passo-3-acesso');
    }
  }

  return (
    <View style={styles.root}>
      <ScreenHero
        photo={PASSO2_PHOTO}
        eyebrow="Passo 02 / Você"
        title="Quem treina"
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
            <WizardProgress total={3} current={2} />
          </View>

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
  form: {
    gap: theme.spacing.lg,
  },
  cta: {
    marginTop: 'auto',
    paddingTop: theme.spacing.xl,
  },
}));
