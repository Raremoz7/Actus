import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import { tokenStorage } from '@/api/storage';
import {
  ChangePasswordResponseSchema,
  type ChangePasswordBody,
  type LoginBody,
  type RegisterBody,
} from '@/types/auth';
import { useAuthStore } from '@/store/authStore';

// As mutations de login/register/logout delegam ao authStore, que detém a
// TRANSAÇÃO ATÔMICA (tokens → /me → status). Os hooks só expõem o ciclo de
// vida do TanStack Query (isPending, error, etc.) para a UI.

export function useLoginMutation(): UseMutationResult<void, unknown, LoginBody> {
  return useMutation({
    mutationFn: ({ email, password }: LoginBody): Promise<void> =>
      useAuthStore.getState().login(email, password),
  });
}

export function useRegisterMutation(): UseMutationResult<void, unknown, RegisterBody> {
  return useMutation({
    mutationFn: (body: RegisterBody): Promise<void> =>
      useAuthStore.getState().register(body),
  });
}

export function useLogoutMutation(): UseMutationResult<void, unknown, void> {
  return useMutation({
    mutationFn: (): Promise<void> => useAuthStore.getState().logout(),
  });
}

// change-password roda fora do store: POST → rotaciona SÓ o access (não há refresh
// novo) → completePasswordChange() revalida o /me e libera o app.
export function useChangePasswordMutation(): UseMutationResult<
  void,
  unknown,
  ChangePasswordBody
> {
  return useMutation({
    mutationFn: async (body: ChangePasswordBody): Promise<void> => {
      const { data } = await api.post(endpoints.auth.changePassword, body);
      const result = parseApi(ChangePasswordResponseSchema, data);
      await tokenStorage.setAccessOnly(result.access_token);
      await useAuthStore.getState().completePasswordChange();
    },
  });
}
