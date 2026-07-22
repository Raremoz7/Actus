// [MOCK — sem endpoint na API v1: imagem real virá do Wger pelo wger_exercise_id]
// Imagem ilustrativa do exercício escolhida pelo grupo muscular. URLs do Unsplash
// curadas e verificadas (200). Estáveis entre reloads (id fixo por grupo).
function unsplash(id: string, size: number): string {
  return `https://images.unsplash.com/photo-${id}?w=${size}&q=70&auto=format&fit=crop`;
}

// Regex → id da foto. Ordem importa (mais específico antes do genérico).
const BY_MUSCLE: [RegExp, string][] = [
  [/peito|chest/, '1534438327276-14e5300c3a48'],
  [/costas|dorsal|back/, '1581009146145-b5ef050c2e1e'],
  [/perna|quadr|posterior|panturr|gl[uú]teo|leg/, '1434608519344-49d77a699e1d'],
  [/ombro|shoulder/, '1532384748853-8f54a8f476e2'],
  [/b[ií]ceps/, '1581009137042-c552e485697a'],
  [/tr[ií]ceps/, '1571019614242-c5c5dee9f50b'],
];

const DEFAULT_ID = '1517836357463-d25dfeac3438'; // academia / pesos (fallback)

// Retorna a URL da imagem do exercício. `size` em px (lado do thumbnail; usa 2x p/ nitidez).
export function exerciseImageUrl(muscleGroup: string | null | undefined, size = 160): string {
  const key = (muscleGroup ?? '').toLowerCase();
  const found = BY_MUSCLE.find(([re]) => re.test(key));
  return unsplash(found ? found[1] : DEFAULT_ID, size);
}
