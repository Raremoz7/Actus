// [MOCK — sem endpoint na API v1: imagem do exercício virá do Wger pelo wger_exercise_id]
// Mostra uma foto ilustrativa por grupo muscular (Unsplash curado). O ícone de
// halter fica como fallback atrás da imagem (aparece se a foto não carregar).
import { Image, View } from 'react-native';
import { Barbell } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { darkTheme } from '@/theme';
import { exerciseImageUrl } from '@/lib/exerciseImage';

const { colors } = darkTheme;

type Props = {
  size?: number;
  muscleGroup?: string | null;
  testID?: string;
};

export function ExerciseThumb({ size = 60, muscleGroup, testID }: Props) {
  const uri = exerciseImageUrl(muscleGroup, Math.round(size * 2));

  return (
    <View testID={testID} style={[styles.thumb, { width: size, height: size }]}>
      <Barbell size={Math.round(size * 0.42)} weight="duotone" color={colors.secondary} />
      <Image
        source={{ uri }}
        resizeMode="cover"
        style={[styles.image, { width: size, height: size }]}
      />
      {/* Véu escuro p/ integrar a foto ao tema quiet luxury. */}
      <View pointerEvents="none" style={[styles.veil, { width: size, height: size }]} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  thumb: {
    borderRadius: 8,
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: 8,
  },
  veil: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 37, 45, 0.28)',
  },
}));
