import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import { BadgeListSchema, type BadgeList } from '@/types/gamification';
import { useAuthStore } from '@/store/authStore';

export const unseenBadgesQueryKey = ['me', 'badges', 'unseen'] as const;

export function useUnseenBadges(): UseQueryResult<BadgeList, unknown> {
  const status = useAuthStore((s) => s.status);
  return useQuery({
    queryKey: unseenBadgesQueryKey,
    queryFn: async (): Promise<BadgeList> => {
      const { data } = await api.get(endpoints.me.badgesUnseen);
      return parseApi(BadgeListSchema, data);
    },
    enabled: status === 'authenticated',
  });
}
