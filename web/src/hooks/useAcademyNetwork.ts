import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { NetworkDashboardSchema } from '../lib/schemas';

// [ACTUS — academia] Hook do dashboard de rede (filiais/franquias). Só retorna dado quando a
// academia logada é network_hq — as demais recebem 403 do backend (ver useNetworkDashboard.isError).
export function useNetworkDashboard() {
  return useQuery({
    queryKey: ['academy-network-dashboard'] as const,
    queryFn: async () => {
      const r = await api.get('/academy/network/dashboard');
      return NetworkDashboardSchema.parse(r.data);
    },
    staleTime: 60_000,
  });
}
