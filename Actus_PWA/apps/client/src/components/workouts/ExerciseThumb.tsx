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
  // Nome do exercício — usado como fallback p/ achar a imagem no catálogo quando
  // não há exerciseId (treinos legados). Mesma lógica da tela de detalhe.
  name?: string | null;
  muscleGroup?: string | null;
  wgerExerciseId?: number | null;
  exerciseId?: string | null;
  testID?: string;
};

export function ExerciseThumb({ size = 60, name, muscleGroup, wgerExerciseId, exerciseId, testID }: Props) {
  // Novo banco: busca imagem pelo exerciseId (slug texto) no catálogo local.
  // Fallback por nome (treinos legados sem exerciseId) — espelha exercicio/[id].tsx,
  // p/ a thumb mostrar a MESMA imagem do detalhe em vez do fallback por grupo.
  const catalogEx = exerciseId
    ? exerciseCatalog().getById(exerciseId)
    : name
      ? (exerciseCatalog().search(name, 1)[0] ?? null)
      : null;
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
