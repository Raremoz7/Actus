import { useQueries, useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { StudentsResponseSchema, type CheckIn, type StudentWorkout } from '../lib/schemas';
import { checkInsQueryOptions, workoutsQueryOptions } from './useStudentDetail';

export function useStudents() {
  return useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const r = await api.get('/professional/students');
      return StudentsResponseSchema.parse(r.data).students;
    },
  });
}

// DECISÃO (documentada): os KPIs do dashboard e os filtros de status da lista
// precisam de check-ins por aluno e a API só expõe por aluno (N+1 inevitável).
// Limitamos o fan-out a MAX_FANOUT alunos mais recentes — acima disso os KPIs e
// status passam a ser parciais sobre a amostra, o que é aceitável para a tela e
// honesto com o custo de rede. As queries compartilham a mesma queryKey do
// detalhe do aluno, então o cache é reaproveitado entre telas.
export const MAX_FANOUT = 30;

export function useStudentsCheckIns(studentIds: string[], days = 30) {
  const ids = studentIds.slice(0, MAX_FANOUT);
  return useQueries({
    queries: ids.map((id) => checkInsQueryOptions(id, days)),
    combine: (results) => {
      const byStudent = new Map<string, CheckIn[]>();
      results.forEach((r, i) => {
        const id = ids[i];
        if (id && r.data) byStudent.set(id, r.data);
      });
      return {
        byStudent,
        isLoading: results.some((r) => r.isLoading),
      };
    },
  });
}

/** Atribuições de treino por aluno (mesmo fan-out limitado; só para a aderência do dashboard). */
export function useStudentsWorkouts(studentIds: string[]) {
  const ids = studentIds.slice(0, MAX_FANOUT);
  return useQueries({
    queries: ids.map((id) => workoutsQueryOptions(id)),
    combine: (results) => {
      const byStudent = new Map<string, StudentWorkout[]>();
      results.forEach((r, i) => {
        const id = ids[i];
        if (id && r.data) byStudent.set(id, r.data);
      });
      return {
        byStudent,
        isLoading: results.some((r) => r.isLoading),
      };
    },
  });
}
