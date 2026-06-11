import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { WorkoutDetailSchema, WorkoutsResponseSchema } from '../lib/schemas';

export function workoutsListQueryOptions() {
  return {
    queryKey: ['workouts'] as const,
    queryFn: async () => {
      const r = await api.get('/workouts');
      return WorkoutsResponseSchema.parse(r.data).workouts;
    },
    staleTime: 60_000,
  };
}

export function useWorkouts() {
  return useQuery(workoutsListQueryOptions());
}

export function workoutDetailQueryOptions(workoutId: string) {
  return {
    queryKey: ['workouts', workoutId] as const,
    queryFn: async () => {
      const r = await api.get(`/workouts/${workoutId}`);
      return WorkoutDetailSchema.parse(r.data);
    },
    staleTime: 60_000,
  };
}

export function useWorkoutDetail(workoutId: string | undefined) {
  return useQuery({
    ...workoutDetailQueryOptions(workoutId ?? ''),
    enabled: workoutId !== undefined && workoutId !== '',
  });
}
