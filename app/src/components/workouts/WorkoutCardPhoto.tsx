import { Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native-unistyles';

import { exerciseImageUrl } from '@/lib/exerciseImage';
import { wgerImageSource } from '@/lib/wger/media';
import { darkTheme } from '@/theme';

const { gradients, cardPhotoScrimLocations } = darkTheme;

// Foto ao fundo de um card de treino (full-bleed), com scrim surface1 que a deixa
// discreta no topo e some na base — meta/CTA ficam sobre fundo limpo. Renderize
// ANTES do conteúdo, dentro de um container com overflow:'hidden'.
// `hint` é a string usada p/ escolher a foto por grupo muscular (nome do treino serve).
// `wgerExerciseId` usa a imagem real do Wger quando disponível; senão cai no hint.
export function WorkoutCardPhoto({ hint, wgerExerciseId }: { hint: string; wgerExerciseId?: number | null }) {
  const source = wgerImageSource(wgerExerciseId) ?? { uri: exerciseImageUrl(hint, 800) };
  return (
    <>
      <Image
        accessible={false}
        source={source}
        resizeMode="cover"
        style={[StyleSheet.absoluteFill, styles.photo]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={gradients.cardPhotoScrim}
        locations={cardPhotoScrimLocations}
        style={StyleSheet.absoluteFill}
      />
    </>
  );
}

const styles = StyleSheet.create(() => ({
  // Foto de fundo bem soft — discreta, no espírito quiet luxury.
  photo: { opacity: 0.16 },
}));
