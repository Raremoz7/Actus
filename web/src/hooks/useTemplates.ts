import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { z } from 'zod';

const TemplateSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  notes: z.string().nullable(),
  created_at: z.string(),
  exercise_count: z.number(),
});
export type TemplateSummary = z.infer<typeof TemplateSummarySchema>;

const TemplateExerciseSchema = z.object({
  id: z.string(),
  position: z.number(),
  exercise_id: z.string().nullable(),
  wger_exercise_id: z.number().nullable(),
  name_snapshot: z.string(),
  sets: z.number(),
  reps: z.number(),
  rest_seconds: z.number(),
  notes: z.string().nullable(),
  muscle_group: z.string().nullable(),
});

const TemplateDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  notes: z.string().nullable(),
  created_at: z.string(),
  exercises: z.array(TemplateExerciseSchema),
});
export type TemplateDetail = z.infer<typeof TemplateDetailSchema>;

export type TemplatePayload = {
  name: string;
  notes?: string;
  exercises: {
    position: number;
    exercise_id?: string | null;
    wger_exercise_id?: number | null;
    name_snapshot: string;
    sets: number;
    reps: number;
    rest_seconds: number;
    notes?: string | null;
    muscle_group?: string | null;
  }[];
};

export function useTemplates() {
  return useQuery({
    queryKey: ['workout-templates'] as const,
    queryFn: async () => {
      const r = await api.get<{ templates: unknown[] }>('/workout-templates');
      return z.array(TemplateSummarySchema).parse(r.data.templates);
    },
    staleTime: 60_000,
  });
}

export function useTemplateDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['workout-templates', id] as const,
    queryFn: async () => {
      const r = await api.get(`/workout-templates/${id}`);
      return TemplateDetailSchema.parse(r.data);
    },
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TemplatePayload) => {
      const r = await api.post<{ template_id: string }>('/workout-templates', payload);
      return r.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['workout-templates'] }),
  });
}

export function useUpdateTemplate(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<TemplatePayload>) => {
      const r = await api.patch(`/workout-templates/${id}`, payload);
      return TemplateDetailSchema.parse(r.data);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['workout-templates'] }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/workout-templates/${id}`);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['workout-templates'] }),
  });
}

export function useCopyTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (templateId: string) => {
      const r = await api.post<{ workout_id: string }>(`/workout-templates/${templateId}/copy`);
      return r.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['workouts'] }),
  });
}
