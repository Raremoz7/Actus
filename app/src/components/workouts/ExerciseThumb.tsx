// Mostra a foto real do exercício (Wger) quando disponível; cai no placeholder
// por grupo muscular (Unsplash curado) caso contrário. O ícone de halter fica
// como fallback atrás da imagem (aparece se a foto não carregar).
import { Image, View } from 'react-native';
import { Barbell } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { darkTheme } from '@/theme';
import { exerciseImageUrl } from '@/lib/exerciseImage';
import { wgerImageSource } from '@/lib/wger/media';

const { colors } = darkTheme;

type Props = {
  size?: number;
  muscleGroup?: string | null;
  wgerExerciseId?: number | null;
  testID?: string;
};

export function ExerciseThumb({ size = 60, muscleGroup, wgerExerciseId, testID }: Props) {
  const wger = wgerImageSource(wgerExerciseId);
  const source = wger ?? { uri: exerciseImageUrl(muscleGroup, Math.round(size * 2)) };

  return (
    <View testID={testID} style={[styles.thumb, { width: size, height: size }]}>
      <Barbell size={Math.round(size * 0.42)} weight="duotone" color={colors.secondary} />
      <Image
        accessible={false}
        source={source}
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
    borderRadius: theme.radius.thumb,
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: theme.radius.thumb,
  },
  veil: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: theme.radius.thumb,
    backgroundColor: theme.colors.veil,
  },
}));
