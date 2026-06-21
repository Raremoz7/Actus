import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ExerciseCatalogSchema,
  type Exercise,
  type ExerciseListResponse,
} from '../lib/exercises';

type Filters = {
  q?: string;
  category?: string;
  equipment?: string;
  level?: string;
  muscle?: string;
  machine_type?: string;
  limit?: number;
  offset?: number;
};

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Catálogo PT-BR estático (asset em /exercises/catalog.json — mesma fonte do app).
 * Fetch único por sessão; filtro e paginação acontecem client-side, espelhando o
 * antigo GET /exercises (busca por nome, muscle casa só com primary_muscles, ordena por name_pt).
 */
function useStaticCatalog() {
  return useQuery<Exercise[]>({
    queryKey: ['exercise-catalog'],
    queryFn: async () => {
      const r = await fetch('/exercises/catalog.json');
      if (!r.ok) throw new Error(`exercise_catalog_fetch_failed_${r.status}`);
      return ExerciseCatalogSchema.parse(await r.json());
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useExerciseCatalog(filters: Filters = {}) {
  const { q, category, equipment, level, muscle, machine_type, limit = 60, offset = 0 } = filters;
  const query = useStaticCatalog();

  const data = useMemo<ExerciseListResponse | undefined>(() => {
    if (!query.data) return undefined;
    const term = normalize(q ?? '');

    const matched = query.data.filter((ex) => {
      if (category && ex.category !== category) return false;
      if (equipment && ex.equipment !== equipment) return false;
      if (level && ex.level !== level) return false;
      if (machine_type && ex.machine_type !== machine_type) return false;
      if (muscle && !ex.primary_muscles.includes(muscle)) return false;
      if (term === '') return true;
      return (
        normalize(ex.name_pt).includes(term) || normalize(ex.name_en).includes(term)
      );
    });

    matched.sort((a, b) => a.name_pt.localeCompare(b.name_pt, 'pt-BR'));

    return {
      total: matched.length,
      exercises: matched.slice(offset, offset + limit),
    };
  }, [query.data, q, category, equipment, level, muscle, machine_type, limit, offset]);

  return {
    data,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useExerciseDetail(id: string | null) {
  const query = useStaticCatalog();
  const data = useMemo<Exercise | undefined>(
    () => (id ? query.data?.find((ex) => ex.id === id) : undefined),
    [query.data, id],
  );
  return {
    data,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
