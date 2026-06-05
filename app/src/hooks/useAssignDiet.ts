import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import {
  AssignDietResponseSchema,
  type AssignDietBody,
  type AssignDietResponse,
} from '@/types/diets';

export interface AssignDietVars {
  studentId: string;
  body: AssignDietBody;
}

// POST /students/:student_id/diets → atribui um template de dieta a um aluno.
// Resposta: 201 { ok: true, student_diet_id }. Verificado no backend (studentDiets.ts).
//
// NOTA: o vínculo aluno↔nutricionista é exigido pelo backend (student_not_linked
// → 403). Não há GET /students/:id/diets na API v1 — não há query de "dietas
// atribuídas a um aluno" para invalidar. Invalidamos a área do aluno
// (['professional','students',studentId]) por precaução; quando o endpoint de
// lista por aluno existir, adicionar a invalidação aqui.
export function useAssignDiet(): UseMutationResult<
  AssignDietResponse,
  unknown,
  AssignDietVars
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ studentId, body }: AssignDietVars): Promise<AssignDietResponse> => {
      const { data } = await api.post(endpoints.studentDiets(studentId), body);
      return parseApi(AssignDietResponseSchema, data);
    },
    onSuccess: (_data: AssignDietResponse, { studentId }: AssignDietVars): void => {
      // Atribuir uma dieta afeta a atividade/programa do aluno.
      queryClient.invalidateQueries({
        queryKey: ['professional', 'students', studentId],
      });
    },
  });
}
