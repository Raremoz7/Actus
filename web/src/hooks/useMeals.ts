import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { MealLogsResponseSchema } from '../lib/schemas';

// TEC-58 — Alimentação. O aluno registra refeições no app mobile; o profissional
// (web) vê o feed e comenta (dispara push ao aluno). Contrato em
// web/docs/backend/tec-58-alimentacao.md. Backend ainda não implementado:
// retry: false p/ cair em estado vazio enquanto não existe.

export function useStudentMeals(studentId: string) {
  return useQuery({
    queryKey: ['student-meals', studentId],
    enabled: studentId !== '',
    queryFn: async () => {
      const r = await api.get(`/professional/students/${studentId}/meals`);
      return MealLogsResponseSchema.parse(r.data).meals;
    },
    retry: false,
    staleTime: 30_000,
  });
}

export function useAddMealComment(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { mealId: string; body: string }) => {
      await api.post(
        `/professional/students/${studentId}/meals/${input.mealId}/comments`,
        { body: input.body },
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['student-meals', studentId] });
    },
  });
}
