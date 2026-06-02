import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Stack, router, useSegments } from 'expo-router';
import { CaretLeft } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { WizardProgress } from '@/components/molecules';
import { darkTheme } from '@/theme';
import { useCadastroDraftStore } from '@/store/cadastroDraftStore';
import {
  CadastroFormSchema,
  cadastroDefaultValues,
  type CadastroForm,
} from '@/features/auth/cadastroForm';

const { colors } = darkTheme;

const TOTAL_PASSOS = 3;

// Deriva o passo atual (1-based) pelo último segmento da rota.
function currentPassoFromSegments(last: string | undefined): number {
  if (last === 'passo-2-voce') return 2;
  if (last === 'passo-3-acesso') return 3;
  return 1;
}

// Layout do wizard de cadastro:
// - FormProvider único: o estado dos 3 passos vive aqui (cada passo é uma rota
//   separada do Stack que lê/escreve via useFormContext).
// - Header custom: botão voltar + WizardProgress (barra segmentada — decisão 05-A).
export default function CadastroLayout() {
  const inviteCode = useCadastroDraftStore((s) => s.inviteCode);

  const methods = useForm<CadastroForm>({
    resolver: zodResolver(CadastroFormSchema),
    defaultValues: cadastroDefaultValues,
    mode: 'onSubmit',
  });

  // invite_code vindo do deep link: injeta UMA vez ao montar o wizard.
  useEffect(() => {
    if (inviteCode) {
      methods.setValue('invite_code', inviteCode);
    }
    // Só na montagem inicial — não reescrever enquanto o usuário edita.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const segments = useSegments();
  const last = segments[segments.length - 1];
  const passo = currentPassoFromSegments(last);

  function handleBack() {
    if (passo > 1 && router.canGoBack()) {
      router.back();
      return;
    }
    // No passo 1, voltar sai do wizard.
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)/escolha-perfil');
    }
  }

  return (
    <FormProvider {...methods}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            hitSlop={12}
            onPress={handleBack}
            style={styles.back}
          >
            <CaretLeft size={22} weight="duotone" color={colors.textTertiary} />
          </Pressable>

          <View style={styles.progress}>
            <WizardProgress total={TOTAL_PASSOS} current={passo} />
          </View>
        </View>

        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            animationDuration: 300,
            contentStyle: styles.content,
          }}
        />
      </SafeAreaView>
    </FormProvider>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.bgBase,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  back: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progress: {
    flex: 1,
  },
  content: {
    backgroundColor: theme.colors.bgBase,
  },
}));
