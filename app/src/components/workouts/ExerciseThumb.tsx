import { Image, View } from 'react-native';
import { Barbell } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { darkTheme } from '@/theme';
import { exerciseImageUrl } from '@/lib/exerciseImage';
import { wgerImageSource } from '@/lib/wger/media';
import { exerciseCatalog } from '@/lib/exercises/catalog';

const { colors } = darkTheme;

type Props = {
  size?: number;
  muscleGroup?: string | null;
  wgerExerciseId?: number | null;
  exerciseId?: string | null;
  testID?: string;
};

export function ExerciseThumb({ size = 60, muscleGroup, wgerExerciseId, exerciseId, testID }: Props) {
  // Novo banco: busca imagem pelo exerciseId (slug texto) no catálogo local.
  const catalogEx = exerciseId ? exerciseCatalog().getById(exerciseId) : null;
  const wger = !catalogEx ? wgerImageSource(wgerExerciseId) : null;
  const source = catalogEx?.image_0_url
    ? { uri: catalogEx.image_0_url }
    : wger ?? { uri: exerciseImageUrl(muscleGroup, Math.round(size * 2)) };

  return (
    <View testID={testID} style={[styles.thumb, { width: size, height: size }]}>
      <Barbell size={Math.round(size * 0.42)} weight="duotone" color={colors.secondary} />
      <Image
        accessible={false}
        source={source}
        resizeMode="cover"
        style={[styles.image, { width: size, height: size }]}
      />
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
