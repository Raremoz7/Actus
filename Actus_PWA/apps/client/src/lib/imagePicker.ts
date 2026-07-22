// Seleção de foto da galeria sobre react-native-image-picker, com a MESMA
// assinatura do expo-image-picker nos pontos que o app usa
// (requestMediaLibraryPermissionsAsync + launchImageLibraryAsync) —
// os consumidores trocam apenas o import.
// O Photo Picker do Android não exige permissão de galeria; o método de
// permissão existe só para manter o contrato e retorna sempre granted.
import { launchImageLibrary } from 'react-native-image-picker';

export type PickedAsset = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
  width?: number;
  height?: number;
};

export type PickResult = { canceled: boolean; assets: PickedAsset[] };

export async function requestMediaLibraryPermissionsAsync(): Promise<{ granted: boolean }> {
  return { granted: true };
}

type LaunchOptions = {
  quality?: number;
  allowsEditing?: boolean;
  aspect?: [number, number];
  mediaTypes?: string[];
};

export async function launchImageLibraryAsync(options: LaunchOptions = {}): Promise<PickResult> {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    quality: (options.quality ?? 0.8) as 0.8,
    selectionLimit: 1,
  });

  if (result.didCancel || !result.assets?.length) {
    return { canceled: true, assets: [] };
  }

  return {
    canceled: false,
    assets: result.assets
      .filter((a) => !!a.uri)
      .map((a) => ({
        uri: a.uri!,
        mimeType: a.type ?? null,
        fileName: a.fileName ?? null,
        width: a.width,
        height: a.height,
      })),
  };
}
