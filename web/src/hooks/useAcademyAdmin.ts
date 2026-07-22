import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { AcademiesResponseSchema, AcademyCreateResponseSchema, AcademyDetailSchema } from '../lib/schemas';

// [ACTUS — academia] Hooks do onboarding pela equipe Actus (área admin). Endpoints /admin/academies/*.

export function useAcademies() {
  return useQuery({
    queryKey: ['admin-academies'] as const,
    queryFn: async () => {
      const r = await api.get('/admin/academies');
      return AcademiesResponseSchema.parse(r.data).academies;
    },
    staleTime: 30_000,
  });
}

export function useAcademyDetail(academyId: string | null) {
  return useQuery({
    queryKey: ['admin-academy', academyId] as const,
    enabled: academyId != null,
    queryFn: async () => {
      const r = await api.get(`/admin/academies/${academyId}`);
      return AcademyDetailSchema.parse(r.data);
    },
  });
}

export function useCreateAcademy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      name: string;
      slug?: string;
      cnpj?: string;
      timezone?: string;
      network_role?: 'standalone' | 'network_hq' | 'unit';
      parent_academy_id?: string;
    }) => {
      const r = await api.post('/admin/academies', body);
      return AcademyCreateResponseSchema.parse(r.data);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-academies'] }),
  });
}

export type CreateManagerBody = {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  birth_date?: string;
  must_change_password?: boolean;
};

export function useCreateAcademyManager() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ academyId, body }: { academyId: string; body: CreateManagerBody }) => {
      const r = await api.post(`/admin/academies/${academyId}/manager`, body);
      return r.data as { id: string; email: string; academy_id: string; role: string };
    },
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: ['admin-academies'] });
      void qc.invalidateQueries({ queryKey: ['admin-academy', vars.academyId] });
    },
  });
}
