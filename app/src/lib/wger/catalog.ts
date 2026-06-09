import type { WgerExercise } from './types';

// Baixa a caixa e remove acentos PT — base da busca e do match.
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[áàâãä]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[íìîï]/g, 'i')
    .replace(/[óòôõö]/g, 'o')
    .replace(/[úùûü]/g, 'u')
    .replace(/ç/g, 'c')
    .trim();
}

// Nome exibível: PT quando existe, senão EN, senão string vazia.
export function exerciseName(ex: WgerExercise): string {
  return ex.name_pt ?? ex.name_en ?? '';
}

// Descrição exibível: PT, senão EN, senão null (a tela omite a seção).
export function exerciseDescription(ex: WgerExercise): string | null {
  return ex.description_pt ?? ex.description_en ?? null;
}

export interface Catalog {
  search: (term: string, limit?: number) => WgerExercise[];
  getExercise: (id: number) => WgerExercise | null;
}

// Factory puro: recebe os exercícios e devolve as operações de leitura.
export function createCatalog(exercises: WgerExercise[]): Catalog {
  const byId = new Map<number, WgerExercise>(exercises.map((e) => [e.id, e]));
  // Índice de busca pré-normalizado (nome PT + EN concatenados p/ o match).
  const index = exercises.map((e) => ({
    ex: e,
    hay: normalize(`${e.name_pt ?? ''} ${e.name_en ?? ''}`),
  }));

  function search(term: string, limit = 30): WgerExercise[] {
    const q = normalize(term);
    if (q.length === 0) return [];
    const hits: { ex: WgerExercise; rank: number }[] = [];
    for (const { ex, hay } of index) {
      const pos = hay.indexOf(q);
      if (pos < 0) continue;
      // rank -1 = prefixo do nome; senão a posição do match (quanto menor, melhor).
      hits.push({ ex, rank: pos === 0 ? -1 : pos });
    }
    hits.sort((a, b) => a.rank - b.rank);
    return hits.slice(0, limit).map((h) => h.ex);
  }

  return {
    search,
    getExercise: (id) => byId.get(id) ?? null,
  };
}
