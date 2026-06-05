import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import {
  AddParticipantsResponseSchema,
  ChallengeMutationResponseSchema,
  type AddParticipantsResponse,
  type Challenge,
  type CreateChallengeBody,
  type PatchChallengeBody,
} from '@/types/challenges';
import { proChallengesListQueryKey } from './useProChallenges';
import { proChallengeDetailQueryKey } from './useProChallengeDetail';

export interface UpdateChallengeVars {
  id: string;
  body: PatchChallengeBody;
}

export interface AddParticipantsVars {
  id: string;
  studentIds: string[];
}

export interface ChallengeMutations {
  // POST /professional/challenges → cria desafio (publicar 'active' direto ou 'draft').
  create: UseMutationResult<Challenge, unknown, CreateChallengeBody>;
  // PATCH /professional/challenges/:id → edita / publica (status 'active') / encerra ('ended').
  update: UseMutationResult<Challenge, unknown, UpdateChallengeVars>;
  // POST /professional/challenges/:id/participants → adiciona participantes (convites).
  addParticipants: UseMutationResult<
    AddParticipantsResponse,
    unknown,
    AddParticipantsVars
  >;
}

// Mutations dos desafios do profissional. As respostas de create/update vêm
// embrulhadas em { challenge }; o desafio é extraído e devolvido cru.
// No sucesso, invalidamos a lista (e o detalhe quando o id é conhecido).
export function useChallengeMutations(): ChallengeMutations {
  const queryClient = useQueryClient();

  const invalidateList = (): void => {
    queryClient.invalidateQueries({ queryKey: proChallengesListQueryKey });
  };

  // POST /professional/challenges → 201 { challenge }.
  const create = useMutation({
    mutationFn: async (body: CreateChallengeBody): Promise<Challenge> => {
      const { data } = await api.post(endpoints.professionalChallenges, body);
      return parseApi(ChallengeMutationResponseSchema, data).challenge;
    },
    onSuccess: invalidateList,
  });

  // PATCH /professional/challenges/:id → 200 { challenge }.
  const update = useMutation({
    mutationFn: async ({ id, body }: UpdateChallengeVars): Promise<Challenge> => {
      const { data } = await api.patch(
        `${endpoints.professionalChallenges}/${id}`,
        body,
      );
      return parseApi(ChallengeMutationResponseSchema, data).challenge;
    },
    onSuccess: (_challenge: Challenge, { id }: UpdateChallengeVars): void => {
      invalidateList();
      queryClient.invalidateQueries({
        queryKey: proChallengeDetailQueryKey(id),
      });
    },
  });

  // POST /professional/challenges/:id/participants → 200 { invited_count }.
  const addParticipants = useMutation({
    mutationFn: async ({
      id,
      studentIds,
    }: AddParticipantsVars): Promise<AddParticipantsResponse> => {
      const { data } = await api.post(
        `${endpoints.professionalChallenges}/${id}/participants`,
        { student_ids: studentIds },
      );
      return parseApi(AddParticipantsResponseSchema, data);
    },
    onSuccess: (
      _result: AddParticipantsResponse,
      { id }: AddParticipantsVars,
    ): void => {
      invalidateList();
      queryClient.invalidateQueries({
        queryKey: proChallengeDetailQueryKey(id),
      });
    },
  });

  return { create, update, addParticipants };
}
