import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import {
  LinkPatchResponseSchema,
  ProfessionalCreateResponseSchema,
  StaffPatchResponseSchema,
  StaffResponseSchema,
  StudentLinksResponseSchema,
} from '../lib/schemas';

export function staffQueryOptions() {
  return {
    queryKey: ['admin-staff'] as const,
    queryFn: async () => {
      const r = await api.get('/admin/staff');
      return StaffResponseSchema.parse(r.data).staff;
    },
    staleTime: 30_000,
  };
}

export function useStaff() {
  return useQuery(staffQueryOptions());
}

export type LinkStatus = 'active' | 'revoked';

export function studentLinksQueryOptions(status: LinkStatus) {
  return {
    queryKey: ['admin-student-links', status] as const,
    queryFn: async () => {
      const r = await api.get('/admin/links/students', { params: { status } });
      return StudentLinksResponseSchema.parse(r.data).links;
    },
    staleTime: 30_000,
  };
}

export function useStudentLinks(status: LinkStatus = 'active') {
  return useQuery(studentLinksQueryOptions(status));
}

export type StaffPatchBody = {
  display_name?: string;
  email?: string;
  must_change_password?: boolean;
  staff_roles?: ('actus_admin' | 'actus_suporte')[];
};

export function usePatchStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, body }: { userId: string; body: StaffPatchBody }) => {
      const r = await api.patch(`/admin/staff/${userId}`, body);
      return StaffPatchResponseSchema.parse(r.data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-staff'] });
    },
  });
}

export function usePatchStudentLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ linkId, status }: { linkId: string; status: LinkStatus }) => {
      const r = await api.patch(`/admin/links/students/${linkId}`, { status });
      return LinkPatchResponseSchema.parse(r.data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-student-links'] });
    },
  });
}

// POST /admin/professionals — discriminated union por professional_role
// (backend/api/src/routes/adminProfessionals.ts:67).
export type CreateProfessionalBody = {
  email: string;
  password: string;
  full_name: string;
  birth_date: string; // YYYY-MM-DD
  must_change_password: boolean;
} & (
  | { professional_role: 'personal'; cref_number?: string }
  | { professional_role: 'nutricionista'; crn_number?: string }
);

export function useCreateProfessional() {
  return useMutation({
    mutationFn: async (body: CreateProfessionalBody) => {
      const r = await api.post('/admin/professionals', body);
      return ProfessionalCreateResponseSchema.parse(r.data);
    },
  });
}
