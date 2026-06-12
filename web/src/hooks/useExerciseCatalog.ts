import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import type { Exercise, ExerciseListResponse } from '../lib/exercises';

type Filters = {
  q?: string;
  category?: string;
  equipment?: string;
  level?: string;
  muscle?: string;
  limit?: number;
  offset?: number;
};

export function useExerciseCatalog(filters: Filters = {}) {
  const { q, category, equipment, level, muscle, limit = 60, offset = 0 } = filters;

  return useQuery<ExerciseListResponse>({
    queryKey: ['exercises', { q, category, equipment, level, muscle, limit, offset }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (category) params.set('category', category);
      if (equipment) params.set('equipment', equipment);
      if (level) params.set('level', level);
      if (muscle) params.set('muscle', muscle);
      params.set('limit', String(limit));
      params.set('offset', String(offset));
      const r = await api.get<ExerciseListResponse>(`/exercises?${params}`);
      return r.data;
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

export function useExerciseDetail(id: string | null) {
  return useQuery<Exercise>({
    queryKey: ['exercises', id],
    queryFn: async () => {
      const r = await api.get<Exercise>(`/exercises/${id}`);
      return r.data;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}
