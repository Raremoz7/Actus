import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { MeSchema } from '../lib/schemas';

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const r = await api.get('/me');
      return MeSchema.parse(r.data);
    },
    staleTime: 60_000,
  });
}
