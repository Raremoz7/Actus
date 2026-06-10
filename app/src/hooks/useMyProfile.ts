import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import { MyProfileSchema, type MyProfile } from '@/types/me';
import { useAuthStore } from '@/store/authStore';

// Chave de cache do perfil rico.
export const myProfileQueryKey = ['me', 'profile'] as const;

// GET /me/profile → perfil rico (display_name/avatar/timezone + full_name/phone/gender/
// peso/nascimento). Usado para PRÉ-PREENCHER editar-perfil (o PATCH /me grava; este lê).
// Só dispara autenticado.
export function useMyProfile(): UseQueryResult<MyProfile, unknown> {
  const status = useAuthStore((s) => s.status);

  return useQuery({
    queryKey: myProfileQueryKey,
    queryFn: async (): Promise<MyProfile> => {
      const { data } = await api.get(endpoints.me.profile);
      return parseApi(MyProfileSchema, data);
    },
    enabled: status === 'authenticated',
  });
}
