import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';

export function useMarkBadgesSeen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (badgeIds: string[]): Promise<void> => {
      await api.post(endpoints.me.badgesSeen, { badge_ids: badgeIds });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me', 'badges'] });
    },
  });
}
