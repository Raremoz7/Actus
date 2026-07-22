import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { z } from 'zod';

import { endpoints } from '@/api/endpoints';
import { tokenStorage } from '@/api/storage';
import { parseApi } from '@/api/parseApi';
import { myProfileQueryKey } from './useMyProfile';
import { meQueryKey } from './useMe';

// Foto escolhida no expo-image-picker (campos relevantes do asset).
export type AvatarAsset = { uri: string; mimeType?: string | null; fileName?: string | null };

const AvatarResponseSchema = z.object({ avatar_url: z.string() });

// POST /me/avatar via FETCH (não axios): no RN, deixar o fetch montar o multipart/form-data
// com boundary é o caminho confiável — o `api` força Content-Type: application/json, que
// quebraria o upload. Bearer lido do tokenStorage. Sucesso → invalida o perfil (avatar atualiza).
export function useUploadAvatar(): UseMutationResult<string, unknown, AvatarAsset> {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (asset: AvatarAsset): Promise<string> => {
      const base = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';
      const token = await tokenStorage.getAccess();
      const form = new FormData();
      const name = asset.fileName ?? 'avatar.jpg';
      const type = asset.mimeType ?? 'image/jpeg';
      // Parte de arquivo do RN: { uri, name, type } — não é um Blob padrão.
      form.append('avatar', { uri: asset.uri, name, type } as unknown as Blob);

      const res = await fetch(`${base}${endpoints.me.avatar}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
      });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const code = (data as { error?: string } | null)?.error ?? 'upload_failed';
        throw new Error(code);
      }
      return parseApi(AvatarResponseSchema, data).avatar_url;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: myProfileQueryKey });
      qc.invalidateQueries({ queryKey: meQueryKey });
    },
  });
}
