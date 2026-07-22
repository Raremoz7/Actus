// Variante WEB do imagePicker: usa <input type="file"> para escolher uma imagem.
// Mesma assinatura do wrapper nativo (requestMediaLibraryPermissionsAsync +
// launchImageLibraryAsync). Retorna um object URL como `uri`.
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

export async function launchImageLibraryAsync(_options: LaunchOptions = {}): Promise<PickResult> {
  return new Promise<PickResult>((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';

    let settled = false;
    const done = (result: PickResult) => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve(result);
    };

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return done({ canceled: true, assets: [] });
      const uri = URL.createObjectURL(file);
      done({
        canceled: false,
        assets: [{ uri, mimeType: file.type || null, fileName: file.name || null }],
      });
    };

    // Se o usuário fechar o seletor sem escolher, o foco volta à janela.
    const onFocus = () => {
      window.removeEventListener('focus', onFocus);
      // pequeno atraso: o onchange dispara depois do focus quando há seleção
      setTimeout(() => done({ canceled: true, assets: [] }), 400);
    };
    window.addEventListener('focus', onFocus);

    document.body.appendChild(input);
    input.click();
  });
}
