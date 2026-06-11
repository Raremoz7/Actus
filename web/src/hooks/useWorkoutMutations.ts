import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import {
  AssignWorkoutResponseSchema,
  WorkoutCreateResponseSchema,
  WorkoutDetailSchema,
} from '../lib/schemas';

// Shape REAL do POST/PATCH /workouts (backend/api/src/routes/workouts.ts — exerciseSchema)
export type WorkoutExercisePayload = {
  position: number;
  wger_exercise_id: number;
  name_snapshot: string;
  sets: number;
  reps: number;
  rest_seconds: number;
  notes?: string;
  muscle_group?: string | null;
};

export type WorkoutPayload = {
  name: string;
  notes?: string;
  exercises: WorkoutExercisePayload[];
};

export function useCreateWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: WorkoutPayload) => {
      const r = await api.post('/workouts', payload);
      return WorkoutCreateResponseSchema.parse(r.data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

/** PATCH /workouts/:id — `exercises` é full-replace no backend. */
export function useUpdateWorkout(workoutId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: WorkoutPayload) => {
      const r = await api.patch(`/workouts/${workoutId}`, payload);
      return WorkoutDetailSchema.parse(r.data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

// Shape REAL do POST /students/:student_id/workouts (backend/api/src/routes/studentWorkouts.ts:129)
export type AssignWorkoutPayload = {
  workout_id: string;
  weekdays: number[]; // 1=segunda … 7=domingo
  start_date?: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
};

export function useAssignWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      studentId,
      payload,
    }: {
      studentId: string;
      payload: AssignWorkoutPayload;
    }) => {
      const r = await api.post(`/students/${studentId}/workouts`, payload);
      return AssignWorkoutResponseSchema.parse(r.data);
    },
    onSuccess: (_data, { studentId }) => {
      void queryClient.invalidateQueries({ queryKey: ['student-workouts', studentId] });
    },
  });
}
