// Par-Q via API real (substitui o antigo mock src/mocks/parq.ts).
// Mantém as assinaturas consumidas pelas telas (useParqSubmission/useParqMap/
// useParqHydrated) + uma mutation de envio. Validação por parseApi sobre os schemas
// de @/types/parq. Endpoints reais: ver src/api/endpoints.ts (parq) e
// backend/docs/CHANGES-actus.md (B5).
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';

import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import { useAuthStore } from '@/store/authStore';
import { useMe } from '@/hooks/useMe';
import {
  ParqGetResponseSchema,
  ParqListResponseSchema,
  ParqPostResponseSchema,
  type ParqAnswer,
  type ParqSubmission,
} from '@/types/parq';

export const myParqQueryKey = ['parq', 'me'] as const;
export const parqStatusesQueryKey = ['parq', 'statuses'] as const;
export function studentParqQueryKey(studentId: string) {
  return ['parq', 'student', studentId] as const;
}

// Aluno lê o próprio Par-Q. Só dispara para sessão de aluno autenticada.
function useMyParq() {
  const status = useAuthStore((s) => s.status);
  const me = useMe();
  return useQuery({
    queryKey: myParqQueryKey,
    queryFn: async () => {
      const { data } = await api.get(endpoints.parq.me);
      return parseApi(ParqGetResponseSchema, data);
    },
    enabled: status === 'authenticated' && me.data?.tipo === 'aluno',
  });
}

// Profissional lê o Par-Q de um aluno vinculado.
function useStudentParq(studentId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: studentParqQueryKey(studentId ?? ''),
    queryFn: async () => {
      const { data } = await api.get(endpoints.parq.professionalStudent(studentId as string));
      return parseApi(ParqGetResponseSchema, data);
    },
    enabled: enabled && Boolean(studentId),
  });
}

// Submissão de um aluno (ou null). Aluno → /me/par-q; profissional → por aluno.
// Chama ambos os hooks incondicionalmente (regra de hooks) mas só um fica `enabled`.
export function useParqSubmission(studentId: string | undefined): ParqSubmission | null {
  const me = useMe();
  const isStudent = me.data?.tipo === 'aluno';
  const my = useMyParq();
  const pro = useStudentParq(studentId, !isStudent && me.data != null);
  return (isStudent ? my.data?.par_q : pro.data?.par_q) ?? null;
}

// Para o gate da Home do aluno: true quando a query do próprio Par-Q já resolveu.
export function useParqHydrated(): boolean {
  return !useMyParq().isLoading;
}

// Mapa studentId → submissão de TODOS os alunos vinculados (status da lista). Bulk.
export function useParqMap(): Record<string, ParqSubmission> {
  const status = useAuthStore((s) => s.status);
  const q = useQuery({
    queryKey: parqStatusesQueryKey,
    queryFn: async () => {
      const { data } = await api.get(endpoints.parq.professionalStatuses);
      return parseApi(ParqListResponseSchema, data);
    },
    enabled: status === 'authenticated',
  });
  const map: Record<string, ParqSubmission> = {};
  for (const r of q.data?.par_q ?? []) map[r.student_id] = r;
  return map;
}

// Envio do Par-Q pelo aluno (POST), invalidando as leituras dependentes.
export function useSubmitParq(): UseMutationResult<
  ParqSubmission,
  unknown,
  { studentId: string; answers: ParqAnswer[] }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ studentId, answers }) => {
      const { data } = await api.post(endpoints.parq.student(studentId), { answers });
      return parseApi(ParqPostResponseSchema, data).par_q;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: myParqQueryKey });
      void qc.invalidateQueries({ queryKey: parqStatusesQueryKey });
    },
  });
}
