import { useQuery } from '@tanstack/react-query';
import { WgerCatalogSchema, type WgerExercise } from '../lib/wger';

/**
 * Catálogo Wger local (asset estático em /wger/catalog.json).
 * Fetch único por sessão: staleTime/gcTime Infinity — o arquivo só muda em deploy.
 */
export function useWgerCatalog() {
  return useQuery<WgerExercise[]>({
    queryKey: ['wger-catalog'],
    queryFn: async () => {
      const r = await fetch('/wger/catalog.json');
      if (!r.ok) throw new Error(`wger_catalog_fetch_failed_${r.status}`);
      return WgerCatalogSchema.parse(await r.json()).exercises;
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
