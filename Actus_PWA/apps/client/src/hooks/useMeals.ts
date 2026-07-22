import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import { tokenStorage } from '@/api/storage';
import { MealLogsResponseSchema, type MealLog, type MealInput } from '@/types/meals';

export const mealsQueryKey = ['me', 'meals'] as const;

// GET /me/meals — feed do próprio aluno. retry:false p/ cair em vazio/erro
// enquanto o backend não existe (decisão do spec).
export function useMeals(): UseQueryResult<MealLog[]> {
  return useQuery({
    queryKey: mealsQueryKey,
    queryFn: async () => {
      const { data } = await api.get(endpoints.me.meals);
      return parseApi(MealLogsResponseSchema, data).meals;
    },
    retry: false,
    staleTime: 30_000,
  });
}

// Monta o multipart de uma refeição (foto opcional + campos).
function mealFormData(input: MealInput): FormData {
  const form = new FormData();
  form.append('eaten_at', input.eatenAt);
  if (input.description != null) form.append('description', input.description);
  for (const tag of input.tags) form.append('tags[]', tag);
  if (input.photoUri) {
    const name = input.photoUri.split('/').pop() ?? 'meal.jpg';
    form.append('photo', { uri: input.photoUri, name, type: 'image/jpeg' } as unknown as Blob);
  }
  return form;
}

async function sendMeal(method: 'POST' | 'PATCH', path: string, input: MealInput): Promise<void> {
  const base = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';
  const token = await tokenStorage.getAccess();
  const res = await fetch(`${base}${path}`, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: mealFormData(input),
  });
  if (!res.ok) {
    const data: unknown = await res.json().catch(() => null);
    throw new Error((data as { error?: string } | null)?.error ?? 'meal_upload_failed');
  }
}

// POST /me/meals (multipart).
export function useCreateMeal(): UseMutationResult<void, unknown, MealInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MealInput) => sendMeal('POST', endpoints.me.meals, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: mealsQueryKey }),
  });
}

// PATCH /me/meals/:id — editar (multipart; foto opcional).
export function useUpdateMeal(): UseMutationResult<void, unknown, { id: string; input: MealInput }> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }) => sendMeal('PATCH', `${endpoints.me.meals}/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: mealsQueryKey }),
  });
}

// DELETE /me/meals/:id.
export function useDeleteMeal(): UseMutationResult<void, unknown, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`${endpoints.me.meals}/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: mealsQueryKey }),
  });
}
