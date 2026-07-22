import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import {
  AcademyDashboardSchema,
  AcademyMembersResponseSchema,
  AcademyStudentsResponseSchema,
} from '../lib/schemas';

// [ACTUS — academia] Hooks do painel do gestor. Endpoints sob /academy/* (escopo por academy_id
// resolvido no backend). Dashboard é agregado server-side — sem fan-out por aluno.

export function academyDashboardQueryOptions() {
  return {
    queryKey: ['academy-dashboard'] as const,
    queryFn: async () => {
      const r = await api.get('/academy/dashboard');
      return AcademyDashboardSchema.parse(r.data);
    },
    staleTime: 60_000,
  };
}
export function useAcademyDashboard() {
  return useQuery(academyDashboardQueryOptions());
}

export type MemberStatusFilter = 'active' | 'revoked' | 'all';

export function useAcademyMembers(status: MemberStatusFilter = 'active') {
  return useQuery({
    queryKey: ['academy-members', status] as const,
    queryFn: async () => {
      const r = await api.get('/academy/members', { params: { status } });
      return AcademyMembersResponseSchema.parse(r.data).members;
    },
    staleTime: 30_000,
  });
}

export function useAcademyStudents(instructorId?: string) {
  return useQuery({
    queryKey: ['academy-students', instructorId ?? 'all'] as const,
    queryFn: async () => {
      const r = await api.get('/academy/students', {
        params: instructorId ? { instructor_id: instructorId } : {},
      });
      return AcademyStudentsResponseSchema.parse(r.data).students;
    },
    staleTime: 30_000,
  });
}

function invalidateTeam(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ['academy-members'] });
  void qc.invalidateQueries({ queryKey: ['academy-dashboard'] });
  void qc.invalidateQueries({ queryKey: ['academy-students'] });
}

export function useAddInstructor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (email: string) => {
      const r = await api.post('/academy/members/instructors', { email });
      return r.data;
    },
    onSuccess: () => invalidateTeam(qc),
  });
}

export function useUpdateMemberStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: 'active' | 'revoked' }) => {
      const r = await api.patch(`/academy/members/${userId}`, { status });
      return r.data;
    },
    onSuccess: () => invalidateTeam(qc),
  });
}

export function useRemoveInstructor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const r = await api.delete(`/academy/members/${userId}`);
      return r.data;
    },
    onSuccess: () => invalidateTeam(qc),
  });
}
