import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { challengesListQueryKey } from './useChallenges';

export interface ChallengeActions {
  accept: UseMutationResult<void, unknown, string>;
  decline: UseMutationResult<void, unknown, string>;
}

// Mutations de participação em desafios: aceitar ou recusar um convite.
// O corpo da resposta não é confiável (pode ser ok/objeto) — só tratamos
// sucesso/erro. No sucesso, invalidamos a lista para refletir o novo
// participant_status via refetch.
export function useChallengeActions(): ChallengeActions {
  const queryClient = useQueryClient();

  const invalidateList = (): void => {
    queryClient.invalidateQueries({ queryKey: challengesListQueryKey });
  };

  // POST /me/challenges/:id/accept → vira participante 'active'.
  const accept = useMutation({
    mutationFn: async (challengeId: string): Promise<void> => {
      await api.post(`${endpoints.me.challenges}/${challengeId}/accept`);
    },
    onSuccess: invalidateList,
  });

  // POST /me/challenges/:id/decline → recusa o convite.
  const decline = useMutation({
    mutationFn: async (challengeId: string): Promise<void> => {
      await api.post(`${endpoints.me.challenges}/${challengeId}/decline`);
    },
    onSuccess: invalidateList,
  });

  return { accept, decline };
}
