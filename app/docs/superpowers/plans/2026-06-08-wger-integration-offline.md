# Integração Wger (offline-first) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir os mocks de exercício (busca por nome livre + imagem Unsplash por grupo) por dados reais do Wger, empacotados no app para funcionar offline.

**Architecture:** Um script de build baixa o catálogo do Wger e gera assets locais (`catalog.json` + imagens webp + require-map). No runtime, `src/lib/wger/` lê esses assets — busca e mídia 100% offline. O builder ganha um picker de busca em 2 passos; as telas de visualização leem a imagem/descrição/vídeo pelo `wger_exercise_id`. Backend inalterado.

**Tech Stack:** Expo SDK 55 · React Native · TypeScript estrito · Zod · Unistyles 3 · Node ESM + `sharp` (script build-time) · Jest + @testing-library/react-native.

**Spec:** `docs/superpowers/specs/2026-06-08-wger-integration-offline-design.md`

---

## File structure

**Novos:**
- `src/lib/wger/types.ts` — Zod schema + tipos do catálogo (shape compartilhado script↔runtime).
- `src/lib/wger/__fixtures__/catalog.sample.json` — fixture pequeno para testes.
- `src/lib/wger/catalog.ts` — load + `searchExercises` + `getExercise` + resolvers de idioma.
- `src/lib/wger/media.ts` — `wgerImageSource` (require-map) + `wgerVideoUrl`.
- `src/features/builder/toApiExercises.ts` — helper puro (extraído de montar-treino) p/ testar a montagem do corpo da API.
- `scripts/build-wger-snapshot.mjs` — pipeline build-time.
- `assets/wger/catalog.json`, `assets/wger/images/<id>.webp`, `assets/wger/images.ts`, `assets/wger/ATTRIBUTION.md` — gerados pelo script.

**Alterados:**
- `src/components/builder/ExerciseFormSheet.tsx` — 2 passos (buscar → prescrever); `ExerciseFormValue` ganha `wgerExerciseId`.
- `app/montar-treino.tsx` — usa `toApiExercises` (id real); hidrata o `wgerExerciseId` em modo edição.
- `src/components/workouts/ExerciseThumb.tsx` — prop `wgerExerciseId`, usa `wgerImageSource` com fallback.
- `src/components/workouts/WorkoutCardPhoto.tsx` — prop `wgerExerciseId`, idem.
- `src/components/workouts/ExerciseCard.tsx` + `app/(aluno)/treino/[id].tsx` + `app/(aluno)/exercicio/[id].tsx` — threading do `wger_exercise_id` + mídia real na tela de exercício.
- `package.json` — devDependency `sharp` + script `wger:snapshot`.

**Inalterado:** backend; `src/lib/exerciseImage.ts` permanece como fallback por grupo.

---

## Task 1: Shape do catálogo (types + fixture)

**Files:**
- Create: `src/lib/wger/types.ts`
- Create: `src/lib/wger/__fixtures__/catalog.sample.json`
- Test: `src/lib/wger/types.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/wger/types.test.ts
import { WgerCatalogSchema } from './types';
import sample from './__fixtures__/catalog.sample.json';

describe('WgerCatalogSchema', () => {
  it('valida o fixture de catálogo', () => {
    const parsed = WgerCatalogSchema.parse(sample);
    expect(parsed.exercises.length).toBeGreaterThan(0);
    expect(parsed.exercises[0]!.id).toBeGreaterThan(0);
  });

  it('rejeita exercício sem id', () => {
    expect(() =>
      WgerCatalogSchema.parse({ generated_at: 'x', source: 'wger', exercises: [{ name_en: 'x' }] }),
    ).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/lib/wger/types.test.ts`
Expected: FAIL — "Cannot find module './types'".

- [ ] **Step 3: Create the fixture**

```json
// src/lib/wger/__fixtures__/catalog.sample.json
{
  "generated_at": "2026-06-08T00:00:00.000Z",
  "source": "wger.de/api/v2",
  "exercises": [
    {
      "id": 101,
      "name_pt": "Supino reto com barra",
      "name_en": "Barbell Bench Press",
      "category": "Peito",
      "equipment": ["Barra"],
      "muscles": ["Peitoral maior"],
      "description_pt": "Deite no banco e empurre a barra.",
      "description_en": "Lie on the bench and press the bar.",
      "hasImage": true,
      "hasVideo": false
    },
    {
      "id": 102,
      "name_pt": null,
      "name_en": "Incline Dumbbell Press",
      "category": "Peito",
      "equipment": ["Halter"],
      "muscles": ["Peitoral maior"],
      "description_pt": null,
      "description_en": "Press dumbbells on an incline bench.",
      "hasImage": false,
      "hasVideo": true
    }
  ]
}
```

- [ ] **Step 4: Implement the schema**

```ts
// src/lib/wger/types.ts
import { z } from 'zod';

// Um exercício do snapshot do Wger. `id` = id da "exercise base" (chave das imagens
// e do wger_exercise_id enviado ao backend). name/description podem faltar num idioma.
export const WgerExerciseSchema = z.object({
  id: z.number().int().positive(),
  name_pt: z.string().nullable(),
  name_en: z.string().nullable(),
  category: z.string(),
  equipment: z.array(z.string()),
  muscles: z.array(z.string()),
  description_pt: z.string().nullable(),
  description_en: z.string().nullable(),
  hasImage: z.boolean(),
  hasVideo: z.boolean(),
});
export type WgerExercise = z.infer<typeof WgerExerciseSchema>;

export const WgerCatalogSchema = z.object({
  generated_at: z.string(),
  source: z.string(),
  exercises: z.array(WgerExerciseSchema),
});
export type WgerCatalog = z.infer<typeof WgerCatalogSchema>;
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest src/lib/wger/types.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/wger/types.ts src/lib/wger/types.test.ts src/lib/wger/__fixtures__/catalog.sample.json
git commit -m "feat(wger): shape do catálogo (types + fixture)"
```

---

## Task 2: Catálogo runtime (busca + lookup + idioma)

**Files:**
- Create: `src/lib/wger/catalog.ts`
- Test: `src/lib/wger/catalog.test.ts`

Pure factory `createCatalog(exercises)` para testar sem o asset real. O singleton que lê o `catalog.json` empacotado entra na Task 4 (depois do snapshot existir).

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/wger/catalog.test.ts
import { createCatalog, exerciseName, exerciseDescription } from './catalog';
import type { WgerExercise } from './types';

const EX: WgerExercise[] = [
  { id: 1, name_pt: 'Supino reto', name_en: 'Bench Press', category: 'Peito', equipment: ['Barra'], muscles: [], description_pt: 'Empurre a barra.', description_en: 'Press the bar.', hasImage: true, hasVideo: false },
  { id: 2, name_pt: null, name_en: 'Incline Press', category: 'Peito', equipment: ['Halter'], muscles: [], description_pt: null, description_en: 'Incline.', hasImage: false, hasVideo: false },
  { id: 3, name_pt: 'Agachamento', name_en: 'Squat', category: 'Pernas', equipment: [], muscles: [], description_pt: null, description_en: null, hasImage: false, hasVideo: false },
];

describe('createCatalog', () => {
  const cat = createCatalog(EX);

  it('acha por nome PT ignorando acento/caixa', () => {
    const r = cat.search('supino');
    expect(r[0]!.id).toBe(1);
  });

  it('faz fallback do nome PT para EN na busca', () => {
    const r = cat.search('incline');
    expect(r.map((e) => e.id)).toContain(2);
  });

  it('prioriza prefixo sobre substring', () => {
    const r = cat.search('agach');
    expect(r[0]!.id).toBe(3);
  });

  it('respeita o limite', () => {
    expect(cat.search('e', 1).length).toBe(1);
  });

  it('getExercise por id', () => {
    expect(cat.getExercise(2)!.name_en).toBe('Incline Press');
    expect(cat.getExercise(999)).toBeNull();
  });
});

describe('resolvers de idioma', () => {
  it('exerciseName: PT quando existe, senão EN', () => {
    expect(exerciseName(EX[0]!)).toBe('Supino reto');
    expect(exerciseName(EX[1]!)).toBe('Incline Press');
  });
  it('exerciseDescription: PT, senão EN, senão null', () => {
    expect(exerciseDescription(EX[0]!)).toBe('Empurre a barra.');
    expect(exerciseDescription(EX[1]!)).toBe('Incline.');
    expect(exerciseDescription(EX[2]!)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/lib/wger/catalog.test.ts`
Expected: FAIL — "Cannot find module './catalog'".

- [ ] **Step 3: Implement the catalog**

```ts
// src/lib/wger/catalog.ts
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
      // rank 0 = prefixo do nome; senão a posição do match (quanto menor, melhor).
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/lib/wger/catalog.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/wger/catalog.ts src/lib/wger/catalog.test.ts
git commit -m "feat(wger): catálogo runtime (busca + lookup + idioma)"
```

---

## Task 3: Pipeline de snapshot (script build-time)

**Files:**
- Create: `scripts/build-wger-snapshot.mjs`
- Modify: `package.json` (devDependency `sharp` + script `wger:snapshot`)
- Generates: `assets/wger/catalog.json`, `assets/wger/images/<id>.webp`, `assets/wger/images.ts`, `assets/wger/ATTRIBUTION.md`

> Script build-time (roda online, no dev). Não tem unit test — valida o output com o Zod do Task 1 e a verificação de contagem no Step final. Endpoints e ids de idioma (en=2, pt=7) confirmados na API do Wger em 2026-06-08; ajuste o mapeamento de campos se o `WgerCatalogSchema.parse` falhar ao rodar.

- [ ] **Step 1: Add sharp + npm script**

Run: `npm install --save-dev sharp`

Em `package.json`, adicione em `scripts`:

```json
"wger:snapshot": "node scripts/build-wger-snapshot.mjs"
```

- [ ] **Step 2: Write the script**

```js
// scripts/build-wger-snapshot.mjs
// Gera o snapshot offline do Wger: catalog.json + imagens webp + require-map.
// Uso: npm run wger:snapshot
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const API = 'https://wger.de/api/v2';
const LANG = { en: 2, pt: 7 };
const OUT = 'assets/wger';
const IMG_DIR = join(OUT, 'images');
const IMG_SIZE = 400; // largura máx. da imagem comprimida

// Busca todas as páginas de um endpoint (segue `next`).
async function fetchAll(path) {
  const out = [];
  let url = `${API}/${path}${path.includes('?') ? '&' : '?'}limit=100&format=json`;
  while (url) {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
    const json = await res.json();
    out.push(...json.results);
    url = json.next;
  }
  return out;
}

const firstName = (arr) => (arr && arr.length ? arr[0].name : null);

async function main() {
  console.log('Baixando bases do Wger…');
  // exercisebaseinfo traz, por base: category, muscles, equipment, images, exercises (traduções), videos.
  const bases = await fetchAll('exercisebaseinfo/');
  console.log(`bases: ${bases.length}`);

  await rm(OUT, { recursive: true, force: true });
  await mkdir(IMG_DIR, { recursive: true });

  const exercises = [];
  const imageIds = [];

  for (const b of bases) {
    const tr = (b.exercises ?? []);
    const pt = tr.find((t) => t.language === LANG.pt);
    const en = tr.find((t) => t.language === LANG.en);
    const name_pt = pt?.name ?? null;
    const name_en = en?.name ?? null;
    if (!name_pt && !name_en) continue; // sem nome em PT nem EN → fora

    // descrição: strip de HTML simples (o Wger guarda <p>…</p>).
    const strip = (h) => (h ? h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || null : null);

    const mainImg = (b.images ?? []).find((i) => i.is_main) ?? (b.images ?? [])[0];
    let hasImage = false;
    if (mainImg?.image) {
      try {
        const buf = Buffer.from(await (await fetch(mainImg.image)).arrayBuffer());
        await sharp(buf).resize({ width: IMG_SIZE, withoutEnlargement: true }).webp({ quality: 72 })
          .toFile(join(IMG_DIR, `${b.id}.webp`));
        hasImage = true;
        imageIds.push(b.id);
      } catch (e) {
        console.warn(`imagem falhou base ${b.id}: ${e.message}`);
      }
    }

    exercises.push({
      id: b.id,
      name_pt,
      name_en,
      category: b.category?.name ?? 'Outros',
      equipment: (b.equipment ?? []).map((e) => e.name),
      muscles: (b.muscles ?? []).map((m) => m.name),
      description_pt: strip(pt?.description),
      description_en: strip(en?.description),
      hasImage,
      hasVideo: (b.videos ?? []).length > 0,
    });
  }

  const catalog = { generated_at: new Date().toISOString(), source: 'wger.de/api/v2', exercises };
  await writeFile(join(OUT, 'catalog.json'), JSON.stringify(catalog));

  // require-map das imagens (Metro precisa de require estático).
  const lines = imageIds.map((id) => `  ${id}: require('./images/${id}.webp'),`).join('\n');
  await writeFile(join(OUT, 'images.ts'),
    `// GERADO por scripts/build-wger-snapshot.mjs — não edite à mão.\n` +
    `import type { ImageSourcePropType } from 'react-native';\n` +
    `export const WGER_IMAGES: Record<number, ImageSourcePropType> = {\n${lines}\n};\n`);

  await writeFile(join(OUT, 'ATTRIBUTION.md'),
    `# Wger\n\nExercícios e imagens de wger.de — licença CC-BY-SA. Snapshot gerado em ${catalog.generated_at}.\n`);

  console.log(`OK: ${exercises.length} exercícios, ${imageIds.length} imagens.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 3: Run the script**

Run: `npm run wger:snapshot`
Expected: termina com `OK: ~851 exercícios, ~357 imagens.` e cria `assets/wger/catalog.json`, `assets/wger/images/*.webp`, `assets/wger/images.ts`, `assets/wger/ATTRIBUTION.md`.
Se o `exercisebaseinfo/` não paginar como esperado ou faltar campo, ajuste `fetchAll`/o mapeamento e rode de novo (o objetivo é o `catalog.json` validar no Step 4).

- [ ] **Step 4: Validate the generated catalog**

Run:
```bash
node -e "const z=require('./src/lib/wger/types.ts');" 2>/dev/null; node --input-type=module -e "import {WgerCatalogSchema} from './src/lib/wger/types.ts'; import c from './assets/wger/catalog.json' assert {type:'json'}; WgerCatalogSchema.parse(c); console.log('catalog OK', c.exercises.length);"
```
Se o runtime de node não importar TS direto, valide via um teste temporário em Jest:
```bash
npx jest --silent -t 'nada' 2>/dev/null; echo "valide no Task 4 (catalog.full.test)"
```
Expected: o catálogo gerado satisfaz `WgerCatalogSchema` (sem erro de parse). A validação definitiva roda no Task 4.

- [ ] **Step 5: Commit**

```bash
git add scripts/build-wger-snapshot.mjs package.json package-lock.json assets/wger
git commit -m "feat(wger): pipeline de snapshot + assets gerados (catálogo + imagens)"
```

---

## Task 4: Carregar o catálogo real + mídia local

**Files:**
- Modify: `src/lib/wger/catalog.ts` (singleton que lê o `catalog.json` empacotado)
- Create: `src/lib/wger/media.ts`
- Test: `src/lib/wger/media.test.ts`, `src/lib/wger/catalog.full.test.ts`

- [ ] **Step 1: Add the bundled-catalog singleton**

Acrescente ao fim de `src/lib/wger/catalog.ts`:

```ts
import { WgerCatalogSchema } from './types';
// eslint-disable-next-line @typescript-eslint/no-var-requires
import catalogJson from '../../../assets/wger/catalog.json';

// Catálogo empacotado (lido uma vez). Se o asset faltar/for inválido, cai num
// catálogo vazio (as telas degradam para o placeholder; o app não quebra).
let _catalog: Catalog | null = null;
export function wgerCatalog(): Catalog {
  if (_catalog) return _catalog;
  const parsed = WgerCatalogSchema.safeParse(catalogJson);
  _catalog = createCatalog(parsed.success ? parsed.data.exercises : []);
  return _catalog;
}
```

> Confirme que `tsconfig`/Metro resolvem `import` de `.json` (Expo já habilita `resolveJsonModule`). Se o eslint reclamar do import de JSON grande, mantenha o `eslint-disable` só nessa linha.

- [ ] **Step 2: Write the media test**

```ts
// src/lib/wger/media.test.ts
jest.mock('../../../assets/wger/images', () => ({ WGER_IMAGES: { 101: { uri: 'mock-101' } } }), { virtual: true });
import { wgerImageSource } from './media';

describe('wgerImageSource', () => {
  it('devolve a source quando há imagem', () => {
    expect(wgerImageSource(101)).toEqual({ uri: 'mock-101' });
  });
  it('devolve null quando não há imagem', () => {
    expect(wgerImageSource(999)).toBeNull();
  });
  it('null para id indefinido', () => {
    expect(wgerImageSource(null)).toBeNull();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx jest src/lib/wger/media.test.ts`
Expected: FAIL — "Cannot find module './media'".

- [ ] **Step 4: Implement media**

```ts
// src/lib/wger/media.ts
import type { ImageSourcePropType } from 'react-native';
import { WGER_IMAGES } from '../../../assets/wger/images';
import { wgerCatalog } from './catalog';

// Imagem local do exercício pelo wger_exercise_id; null quando não há (→ placeholder por grupo).
export function wgerImageSource(wgerId: number | null | undefined): ImageSourcePropType | null {
  if (wgerId == null) return null;
  return WGER_IMAGES[wgerId] ?? null;
}

// URL de vídeo do Wger (online) quando o exercício tem vídeo; senão null.
export function wgerVideoUrl(wgerId: number | null | undefined): string | null {
  if (wgerId == null) return null;
  const ex = wgerCatalog().getExercise(wgerId);
  if (!ex?.hasVideo) return null;
  return `https://wger.de/en/exercise/${wgerId}/view/`;
}
```

- [ ] **Step 5: Write the full-catalog smoke test**

```ts
// src/lib/wger/catalog.full.test.ts
import { wgerCatalog } from './catalog';

describe('catálogo empacotado', () => {
  it('carrega e busca exercícios reais', () => {
    const cat = wgerCatalog();
    expect(cat.search('press').length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 6: Run tests**

Run: `npx jest src/lib/wger/media.test.ts src/lib/wger/catalog.full.test.ts`
Expected: PASS. (Se o smoke test falhar por catálogo vazio, o Task 3 não gerou o asset — volte e rode `npm run wger:snapshot`.)

- [ ] **Step 7: Commit**

```bash
git add src/lib/wger/catalog.ts src/lib/wger/media.ts src/lib/wger/media.test.ts src/lib/wger/catalog.full.test.ts
git commit -m "feat(wger): catálogo empacotado + mídia local (imagem/vídeo)"
```

---

## Task 5: Helper de montagem da API (id real)

**Files:**
- Create: `src/features/builder/toApiExercises.ts`
- Modify: `src/components/builder/ExerciseFormSheet.tsx` (tipo `ExerciseFormValue`)
- Test: `src/features/builder/toApiExercises.test.ts`

- [ ] **Step 1: Add `wgerExerciseId` ao ExerciseFormValue**

Em `src/components/builder/ExerciseFormSheet.tsx`, no tipo `ExerciseFormValue` (perto da linha 27), adicione o campo:

```ts
export type ExerciseFormValue = {
  name: string;
  wgerExerciseId: number; // id real do Wger (escolhido na busca)
  sets: number;
  reps: number;
  restSeconds: number;
  notes: string | null;
  muscleGroup: string | null;
};
```

- [ ] **Step 2: Write the failing test**

```ts
// src/features/builder/toApiExercises.test.ts
import { toApiExercises } from './toApiExercises';
import type { ExerciseFormValue } from '@/components/builder';

const v = (over: Partial<ExerciseFormValue>): ExerciseFormValue => ({
  name: 'Supino', wgerExerciseId: 101, sets: 3, reps: 10, restSeconds: 60, notes: null, muscleGroup: 'Peito', ...over,
});

describe('toApiExercises', () => {
  it('usa o wger_exercise_id real e position sequencial', () => {
    const out = toApiExercises([v({ wgerExerciseId: 101 }), v({ wgerExerciseId: 202, name: 'Crucifixo' })]);
    expect(out[0]).toMatchObject({ position: 1, wger_exercise_id: 101, name_snapshot: 'Supino' });
    expect(out[1]).toMatchObject({ position: 2, wger_exercise_id: 202, name_snapshot: 'Crucifixo' });
  });

  it('omite notes/muscle_group vazios', () => {
    const out = toApiExercises([v({ notes: null, muscleGroup: null })]);
    expect(out[0]!.notes).toBeUndefined();
    expect(out[0]!.muscle_group).toBeUndefined();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx jest src/features/builder/toApiExercises.test.ts`
Expected: FAIL — "Cannot find module './toApiExercises'".

- [ ] **Step 4: Implement the helper**

```ts
// src/features/builder/toApiExercises.ts
import type { ExerciseFormValue } from '@/components/builder';
import type { CreateWorkoutExercise } from '@/types/workouts';

// Converte os exercícios do builder no exercises[] da API (position 1-based +
// wger_exercise_id REAL escolhido na busca). Mesma forma p/ create e PATCH (full replace).
export function toApiExercises(drafts: ExerciseFormValue[]): CreateWorkoutExercise[] {
  return drafts.map((d, i) => ({
    position: i + 1,
    wger_exercise_id: d.wgerExerciseId,
    name_snapshot: d.name,
    sets: d.sets,
    reps: d.reps,
    rest_seconds: d.restSeconds,
    notes: d.notes ?? undefined,
    muscle_group: d.muscleGroup ?? undefined,
  }));
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest src/features/builder/toApiExercises.test.ts`
Expected: PASS.

- [ ] **Step 6: Wire montar-treino to the helper**

Em `app/montar-treino.tsx`:
1. Remova a const `WGER_PLACEHOLDER_ID` (linha ~39) e a função local `toApiExercises` (linhas ~48-59).
2. Importe o helper: `import { toApiExercises } from '@/features/builder/toApiExercises';`
3. Na hidratação em modo edição (linhas ~118-125), inclua o `wgerExerciseId` real vindo do backend:

```ts
.map((e) => ({
  name: e.name_snapshot,
  wgerExerciseId: e.wger_exercise_id,
  sets: e.sets,
  reps: e.reps,
  restSeconds: e.rest_seconds,
  notes: e.notes,
  muscleGroup: e.muscle_group,
})),
```

- [ ] **Step 7: Typecheck + run builder tests**

Run: `npm run typecheck && npx jest montar-treino`
Expected: typecheck limpo; testes existentes do builder passam (ajuste fixtures que construam `ExerciseFormValue` para incluir `wgerExerciseId`).

- [ ] **Step 8: Commit**

```bash
git add src/features/builder/toApiExercises.ts src/features/builder/toApiExercises.test.ts src/components/builder/ExerciseFormSheet.tsx app/montar-treino.tsx
git commit -m "feat(wger): builder envia wger_exercise_id real (helper extraído)"
```

---

## Task 6: ExerciseFormSheet — picker em 2 passos (buscar → prescrever)

**Files:**
- Modify: `src/components/builder/ExerciseFormSheet.tsx`
- Test: `src/components/builder/ExerciseFormSheet.test.tsx`

Estado novo: `mode: 'search' | 'prescribe'`. No modo `search`, campo de busca + resultados de `wgerCatalog().search`. Ao escolher, guarda `picked` (nome + id + muscleGroup do `category`) e vai pra `prescribe` (form atual de séries/reps/descanso/notas, com o nome travado). Em edição (`initialValue`), abre direto em `prescribe`.

- [ ] **Step 1: Add the category→PT muscle map**

No topo de `ExerciseFormSheet.tsx` (perto de `MUSCLE_GROUPS`):

```ts
// Categoria do Wger (EN) → grupo muscular canônico PT (alinhado a MUSCLE_GROUPS).
const CATEGORY_PT: Record<string, string> = {
  Chest: 'Peito', Back: 'Costas', Legs: 'Pernas', Arms: 'Braço',
  Shoulders: 'Ombro', Abs: 'Core', Calves: 'Pernas', Cardio: 'Cardio',
};
function categoryToMuscleGroup(category: string): string | null {
  return CATEGORY_PT[category] ?? category ?? null;
}
```

- [ ] **Step 2: Write the failing test**

```tsx
// src/components/builder/ExerciseFormSheet.test.tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ExerciseFormSheet } from './ExerciseFormSheet';

jest.mock('@/lib/wger/catalog', () => ({
  // exerciseName também é importado pelo componente — precisa existir no mock do módulo.
  exerciseName: (ex: { name_pt: string | null; name_en: string | null }) => ex.name_pt ?? ex.name_en ?? '',
  wgerCatalog: () => ({
    search: (t: string) => (t.toLowerCase().includes('sup')
      ? [{ id: 101, name_pt: 'Supino reto', name_en: 'Bench', category: 'Chest', equipment: ['Barra'], muscles: [], description_pt: null, description_en: null, hasImage: true, hasVideo: false }]
      : []),
    getExercise: () => null,
  }),
}));

describe('ExerciseFormSheet (busca → prescrever)', () => {
  it('busca, escolhe e confirma com wgerExerciseId', () => {
    const onConfirm = jest.fn();
    render(<ExerciseFormSheet visible initialValue={null} onClose={() => {}} onConfirm={onConfirm} />);

    fireEvent.changeText(screen.getByLabelText('Buscar exercício'), 'sup');
    fireEvent.press(screen.getByText('Supino reto'));        // passo prescrever
    fireEvent.press(screen.getByText('Adicionar'));

    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Supino reto', wgerExerciseId: 101, muscleGroup: 'Peito', sets: 3, reps: 10 }),
    );
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx jest src/components/builder/ExerciseFormSheet.test.tsx`
Expected: FAIL — não existe `getByLabelText('Buscar exercício')` (ainda é o form de nome livre).

- [ ] **Step 4: Implement the two-step sheet**

Reescreva o corpo do `ExerciseFormSheet` para os 2 modos. Pontos-chave (mantém estilos e o passo de prescrição atuais):

```tsx
import { wgerCatalog, exerciseName } from '@/lib/wger/catalog';
import type { WgerExercise } from '@/lib/wger/types';
// ...
const [mode, setMode] = useState<'search' | 'prescribe'>(initialValue ? 'prescribe' : 'search');
const [query, setQuery] = useState('');
const [picked, setPicked] = useState<{ name: string; wgerId: number; muscleGroup: string | null } | null>(
  initialValue ? { name: initialValue.name, wgerId: initialValue.wgerExerciseId, muscleGroup: initialValue.muscleGroup } : null,
);
const results = useMemo(() => (query.trim() ? wgerCatalog().search(query, 20) : []), [query]);

function choose(ex: WgerExercise) {
  setPicked({ name: exerciseName(ex), wgerId: ex.id, muscleGroup: categoryToMuscleGroup(ex.category) });
  setName(exerciseName(ex));
  setMuscleGroup(categoryToMuscleGroup(ex.category));
  setMode('prescribe');
}

// no reset (useEffect de visible): mode = initialValue ? 'prescribe' : 'search'; query = ''.
```

No JSX, quando `mode === 'search'`: campo de busca + lista de resultados:

```tsx
<View style={styles.search}>
  <MagnifyingGlass size={18} weight="duotone" color={colors.textTertiary} />
  <TextInput
    style={styles.searchInput}
    accessibilityLabel="Buscar exercício"
    placeholder="Buscar no Wger (ex.: supino)"
    placeholderTextColor={colors.textTertiary}
    value={query}
    onChangeText={setQuery}
    autoFocus
  />
</View>
{results.map((ex) => (
  <Pressable key={ex.id} accessibilityRole="button" onPress={() => choose(ex)} style={styles.resultRow}>
    <ExerciseThumb size={40} wgerExerciseId={ex.id} muscleGroup={ex.muscles[0] ?? null} />
    <View style={{ flex: 1 }}>
      <AppText variant="bodyMd">{exerciseName(ex)}</AppText>
      <AppText variant="metaSmall" color="tertiary">{ex.category}{ex.equipment[0] ? ` · ${ex.equipment[0]}` : ''}</AppText>
    </View>
  </Pressable>
))}
```

Quando `mode === 'prescribe'`: o form atual (séries/reps/descanso/notas), com o nome do exercício travado no topo (texto, não Input) e um link "trocar" que volta pra `setMode('search')`. No `handleConfirm`, inclua `wgerExerciseId: picked!.wgerId`:

```tsx
onConfirm({
  name: picked!.name,
  wgerExerciseId: picked!.wgerId,
  sets: parsed.sets as number,
  reps: parsed.reps as number,
  restSeconds: parsed.rest as number,
  notes: notes.trim() === '' ? null : notes.trim(),
  muscleGroup,
});
```

Adicione os estilos `search`, `searchInput`, `resultRow` (espelhe os de `StudentsScreen`/`ExerciseCard`). Remova o `Input` de nome livre.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest src/components/builder/ExerciseFormSheet.test.tsx`
Expected: PASS.

- [ ] **Step 6: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: limpos.

- [ ] **Step 7: Commit**

```bash
git add src/components/builder/ExerciseFormSheet.tsx src/components/builder/ExerciseFormSheet.test.tsx
git commit -m "feat(wger): picker de busca em 2 passos no builder"
```

---

## Task 7: Mídia real nos thumbs (ExerciseThumb + WorkoutCardPhoto)

**Files:**
- Modify: `src/components/workouts/ExerciseThumb.tsx`
- Modify: `src/components/workouts/WorkoutCardPhoto.tsx`
- Modify: `src/components/workouts/ExerciseCard.tsx` (passa `wgerExerciseId` ao thumb)
- Test: `src/components/workouts/ExerciseThumb.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/workouts/ExerciseThumb.test.tsx
import { render } from '@testing-library/react-native';
import { ExerciseThumb } from './ExerciseThumb';

jest.mock('@/lib/wger/media', () => ({ wgerImageSource: (id: number | null) => (id === 101 ? { uri: 'wger-101' } : null) }));

describe('ExerciseThumb', () => {
  it('usa a imagem do Wger quando o id tem imagem', () => {
    const { UNSAFE_getByProps } = render(<ExerciseThumb wgerExerciseId={101} muscleGroup="Peito" testID="t" />);
    expect(UNSAFE_getByProps({ source: { uri: 'wger-101' } })).toBeTruthy();
  });

  it('cai no placeholder por grupo quando não há imagem Wger', () => {
    // id sem imagem → usa exerciseImageUrl(muscleGroup); só garante que renderiza sem crashar.
    const { getByTestId } = render(<ExerciseThumb wgerExerciseId={999} muscleGroup="Peito" testID="t" />);
    expect(getByTestId('t')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/components/workouts/ExerciseThumb.test.tsx`
Expected: FAIL — `ExerciseThumb` ainda não aceita `wgerExerciseId`.

- [ ] **Step 3: Implement ExerciseThumb**

Em `src/components/workouts/ExerciseThumb.tsx`, adicione a prop e priorize a imagem do Wger:

```tsx
import { wgerImageSource } from '@/lib/wger/media';

type Props = { size?: number; wgerExerciseId?: number | null; muscleGroup?: string | null; testID?: string };

export function ExerciseThumb({ size = 60, wgerExerciseId, muscleGroup, testID }: Props) {
  const wger = wgerImageSource(wgerExerciseId);
  const source = wger ?? { uri: exerciseImageUrl(muscleGroup, Math.round(size * 2)) };
  // ...resto igual, trocando source={{ uri }} por source={source}
}
```

- [ ] **Step 4: Implement WorkoutCardPhoto**

Em `src/components/workouts/WorkoutCardPhoto.tsx`, aceite `wgerExerciseId?: number | null` e use `wgerImageSource(wgerExerciseId) ?? { uri: exerciseImageUrl(hint, 800) }` como `source` da `Image`. Mantenha o scrim.

- [ ] **Step 5: Pass the id from ExerciseCard**

Em `src/components/workouts/ExerciseCard.tsx`: adicione a prop `wgerExerciseId?: number | null` e repasse ao `<ExerciseThumb wgerExerciseId={wgerExerciseId} muscleGroup={muscleGroup} />`. Em `app/(aluno)/treino/[id].tsx`, no `.map` de `ExerciseCard`, passe `wgerExerciseId={e.wger_exercise_id}`.

- [ ] **Step 6: Run tests + typecheck**

Run: `npm run typecheck && npx jest src/components/workouts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/workouts/ExerciseThumb.tsx src/components/workouts/WorkoutCardPhoto.tsx src/components/workouts/ExerciseCard.tsx src/components/workouts/ExerciseThumb.test.tsx 'app/(aluno)/treino/[id].tsx'
git commit -m "feat(wger): imagem real do Wger nos thumbs (fallback por grupo)"
```

---

## Task 8: Tela de exercício — imagem + descrição + vídeo reais

**Files:**
- Modify: `app/(aluno)/exercicio/[id].tsx`
- Modify: `src/components/workouts/ExerciseCard.tsx` (passa `wgerId` nos params da navegação)
- Test: manual + `npm run typecheck`

A tela já recebe params via `ExerciseCard.onPress`. Adicione `wgerId` aos params, e use `wgerCatalog().getExercise` + `wgerImageSource` + `wgerVideoUrl`.

- [ ] **Step 1: Pass `wgerId` in navigation params**

Em `app/(aluno)/treino/[id].tsx` (onPress do `ExerciseCard`, ~linha 106-121) e em `app/(aluno)/exercicio/[id].tsx` (`goTo`, ~linha 75-90), inclua `wgerId: String(e.wger_exercise_id)` (e `sibling.wger_exercise_id`) no objeto `params`.

- [ ] **Step 2: Read the wger media on the screen**

Em `app/(aluno)/exercicio/[id].tsx`, leia o novo param e resolva a mídia:

```tsx
import { wgerCatalog, exerciseDescription } from '@/lib/wger/catalog';
import { wgerImageSource, wgerVideoUrl } from '@/lib/wger/media';
import { Linking } from 'react-native';
// ...
const wgerId = Number(params.wgerId);
const ex = Number.isFinite(wgerId) ? wgerCatalog().getExercise(wgerId) : null;
const heroSource = wgerImageSource(wgerId) ?? { uri: exerciseImageUrl(muscle, 1200) };
const description = ex ? exerciseDescription(ex) : null;
const videoUrl = wgerVideoUrl(wgerId);
```

- [ ] **Step 3: Use the real image + description + video button**

- Troque a `source` da `Image` do herói por `heroSource`.
- Acrescente, no corpo, a seção "Como executar" quando `description` existir:

```tsx
{description ? (
  <>
    <AppText variant="eyebrow" color="tertiary" style={styles.secLabel}>Como executar</AppText>
    <AppText variant="bodySm" color="secondary">{description}</AppText>
  </>
) : null}
```

- Substitua o bloco fixo "Demonstração em vídeo ainda não disponível" por: botão neon quando `videoUrl`, senão o aviso atual:

```tsx
{videoUrl ? (
  <Pressable accessibilityRole="button" accessibilityLabel="Ver demonstração em vídeo"
    style={styles.videoBtn} onPress={() => void Linking.openURL(videoUrl)}>
    <View style={styles.videoPlay}><Play size={16} weight="fill" color={colors.textInverse} /></View>
    <AppText variant="label">Ver demonstração em vídeo</AppText>
  </Pressable>
) : (
  /* bloco atual de "ainda não disponível" */
)}
```

(Importe `Play` de `phosphor-react-native`; adicione estilos `videoBtn`/`videoPlay` espelhando o `demo`/`demoIcon` atuais, com `videoPlay` em `colors.neon`.)

- Acrescente o crédito discreto da licença ao fim do corpo, só quando a mídia veio do Wger (`ex` existe):

```tsx
{ex ? (
  <AppText variant="metaSmall" color="tertiary" style={styles.credit}>Wger · CC-BY-SA</AppText>
) : null}
```

(Adicione `credit: { marginTop: theme.spacing.lg }` aos estilos.)

- [ ] **Step 4: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: limpos.

- [ ] **Step 5: Manual verification (dev build)**

Run: `npm run start` → no app (personal): Treinos → Montar treino → Adicionar exercício → buscar "supino" → escolher → prescrever → salvar. Depois (aluno) abra o treino → toque no exercício → confira imagem real, descrição e botão de vídeo (quando houver). Offline: ative modo avião e confirme que busca/imagem/descrição seguem funcionando.

- [ ] **Step 6: Commit**

```bash
git add 'app/(aluno)/exercicio/[id].tsx' 'app/(aluno)/treino/[id].tsx' src/components/workouts/ExerciseCard.tsx
git commit -m "feat(wger): tela de exercício com imagem/descrição/vídeo reais"
```

---

## Final: regressão completa

- [ ] Run: `npm run typecheck && npm run lint && npx jest`
- [ ] Expected: typecheck limpo, lint sem warnings, toda a suíte verde.
- [ ] Confirme o tamanho do bundle de assets: `du -sh assets/wger` (esperado ~10 MB).

---

## Notas de implementação

- **Offline:** busca, nome, grupo, descrição e imagem vêm dos assets empacotados — zero rede no runtime. Só o **vídeo** abre `wger.de` (online).
- **Fallback:** exercício sem imagem no Wger (~58%) ou treino legado (id que não está no snapshot) cai no placeholder por grupo (`exerciseImage.ts`) — comportamento atual preservado.
- **Atualizar o catálogo:** re-rodar `npm run wger:snapshot` e commitar os assets (entra num release do app; sem sync online — YAGNI).
- **Licença:** `assets/wger/ATTRIBUTION.md` registra CC-BY-SA; a tela de exercício mostra o crédito "Wger · CC-BY-SA".
