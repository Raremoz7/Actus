// Passo de foto (aluno e professor). Seleciona da galeria (expo-image-picker) e envia
// via POST /me/avatar (useUploadAvatar). Passo OPCIONAL: nenhum erro trava o onboarding —
// dá para pular e completar depois no perfil.
// [requer dev client com o módulo nativo do expo-image-picker compilado — rebuild se ausente]
import { useState } from 'react';
import { Alert, Image, Pressable, View } from 'react-native';
import * as ImagePicker from '@/lib/imagePicker';
import { UserCircle } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { OnboardingScreen } from './OnboardingScreen';
import { useUploadAvatar } from '@/hooks/useUploadAvatar';
import { darkTheme } from '@/theme';
import { apiErrorMessage } from '@/lib/apiErrorMessage';

const { colors } = darkTheme;

type Props = {
  step: number;
  total: number;
  subtitle: string;
  onAdvance: () => void;
};

export function FotoStep({ step, total, subtitle, onAdvance }: Props) {
  const upload = useUploadAvatar();
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  async function pickAndUpload() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Permissão necessária',
        'Libere o acesso às fotos para escolher uma imagem, ou pule por enquanto.',
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset) return;
    setPreviewUri(asset.uri);
    // Sucesso → avança. Falha → mantém na tela (a foto é opcional; pode pular).
    upload.mutate(
      { uri: asset.uri, mimeType: asset.mimeType, fileName: asset.fileName },
      {
        onSuccess: () => onAdvance(),
        onError: (err) => {
          Alert.alert(
            'Não foi possível enviar',
            `${apiErrorMessage(err)} Tente outra foto ou pule por enquanto — dá para adicionar depois no perfil.`,
          );
        },
      },
    );
  }

  return (
    <OnboardingScreen
      step={step}
      total={total}
      title="Adicione uma foto de perfil"
      subtitle={subtitle}
      ctaLabel={previewUri ? 'Trocar foto' : 'Adicionar foto'}
      ctaLoading={upload.isPending}
      onCta={() => void pickAndUpload()}
      skipLabel="Pular por enquanto"
      onSkip={onAdvance}
    >
      <View style={styles.avatarWrap}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Adicionar foto de perfil"
          onPress={() => void pickAndUpload()}
          style={styles.avatar}
        >
          {previewUri ? (
            <Image source={{ uri: previewUri }} style={styles.avatarImage} resizeMode="cover" />
          ) : (
            <UserCircle size={64} weight="duotone" color={colors.textTertiary} />
          )}
        </Pressable>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  avatarWrap: { alignItems: 'center', gap: theme.spacing.md, paddingVertical: theme.spacing.xl },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
}));
