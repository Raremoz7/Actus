import { useFonts } from 'expo-font';
import {
  BarlowCondensed_800ExtraBold,
  BarlowCondensed_900Black,
} from '@expo-google-fonts/barlow-condensed';
import {
  Barlow_400Regular,
  Barlow_500Medium,
  Barlow_600SemiBold,
  Barlow_700Bold,
} from '@expo-google-fonts/barlow';
import { ShareTechMono_400Regular } from '@expo-google-fonts/share-tech-mono';

// Carrega todas as famílias do design system. Retorna true quando prontas.
export function useAppFonts(): boolean {
  const [loaded] = useFonts({
    BarlowCondensed_800ExtraBold,
    BarlowCondensed_900Black,
    Barlow_400Regular,
    Barlow_500Medium,
    Barlow_600SemiBold,
    Barlow_700Bold,
    ShareTechMono_400Regular,
  });

  return loaded;
}
