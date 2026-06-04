import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';
import { View } from 'react-native';

import { useCadastroDraftStore } from '@/store/cadastroDraftStore';
import {
  CadastroFormSchema,
  cadastroDefaultValues,
  type CadastroForm,
} from '@/features/auth/cadastroForm';

// Layout do wizard de cadastro:
// - FormProvider único: o estado dos 3 passos vive aqui (cada passo é uma rota
//   separada do Stack que lê/escreve via useFormContext).
// - Hero + barra de progresso + voltar vivem DENTRO de cada passo, para deslizarem
//   junto com o slide do Stack (a motion do wizard).
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

  return (
    <FormProvider {...methods}>
      <View style={styles.root}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            animationDuration: 300,
            contentStyle: styles.content,
          }}
        />
      </View>
    </FormProvider>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bgBase,
  },
  content: {
    backgroundColor: theme.colors.bgBase,
  },
}));
