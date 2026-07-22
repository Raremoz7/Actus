import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import {
  AnamneseTemplatesResponseSchema,
  StudentAnamneseResponseSchema,
  type AnamneseAnswerValue,
  type AnamneseField,
} from '../lib/schemas';

// TEC-57 — Anamnese dinâmica. Endpoints sob /professional (contrato em
// web/docs/backend/tec-57-anamnese.md). Backend ainda não implementado:
// as queries usam retry: false para falhar rápido e cair no estado vazio.

export function useAnamneseTemplates() {
  return useQuery({
    queryKey: ['anamnese-templates'],
    queryFn: async () => {
      const r = await api.get('/professional/anamnese/templates');
      return AnamneseTemplatesResponseSchema.parse(r.data).templates;
    },
    retry: false,
    staleTime: 60_000,
  });
}

export type TemplateInput = { name: string; fields: AnamneseField[] };

export function useCreateAnamneseTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: TemplateInput) => {
      await api.post('/professional/anamnese/templates', input);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['anamnese-templates'] });
      void qc.invalidateQueries({ queryKey: ['student-anamnese'] });
    },
  });
}

export function useUpdateAnamneseTemplate(templateId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<TemplateInput> & { is_active?: boolean }) => {
      await api.patch(`/professional/anamnese/templates/${templateId}`, input);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['anamnese-templates'] });
      void qc.invalidateQueries({ queryKey: ['student-anamnese'] });
    },
  });
}

export function useStudentAnamnese(studentId: string) {
  return useQuery({
    queryKey: ['student-anamnese', studentId],
    enabled: studentId !== '',
    queryFn: async () => {
      const r = await api.get(`/professional/students/${studentId}/anamnese`);
      return StudentAnamneseResponseSchema.parse(r.data);
    },
    retry: false,
    staleTime: 30_000,
  });
}

export function useSaveStudentAnamnese(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { template_id: string; answers: Record<string, AnamneseAnswerValue> }) => {
      await api.put(`/professional/students/${studentId}/anamnese`, input);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['student-anamnese', studentId] });
    },
  });
}
