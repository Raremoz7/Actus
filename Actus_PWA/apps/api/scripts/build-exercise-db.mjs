// Pipeline de merge do banco de exercícios em PT-BR.
//
// Fontes:
//   EN + imagens: yuhonas/free-exercise-db (Unlicense — domínio público)
//   PT-BR:        joao-gugel/exercicios-bd-ptbr (sem licença formal — uso com atribuição)
//
// Saída:
//   backend/local/seed-exercises.sql
//   backend/local/exercise-enum-map-pt.json   ← mapa EN→PT para revisão humana
//   backend/local/exercises-coverage.md
//   backend/local/CREDITS-exercises.md
//
// Imagens:
//   DOWNLOAD_IMAGES=true  → baixa para backend/uploads/exercises/ e grava URLs locais
//   DOWNLOAD_IMAGES=false → grava URLs raw.githubusercontent (padrão dev)
//
// Uso:
//   node scripts/build-exercise-db.mjs
//   DOWNLOAD_IMAGES=true node scripts/build-exercise-db.mjs

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, '..');
const LOCAL_DIR = join(ROOT, 'local');
const IMG_DIR   = join(ROOT, 'api', 'uploads', 'exercises');

const DOWNLOAD_IMAGES = process.env.DOWNLOAD_IMAGES === 'true';

const EN_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const PT_URL = 'https://raw.githubusercontent.com/joao-gugel/exercicios-bd-ptbr/main/exercises/exercises-ptbr-full-translation.json';
const IMG_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

// ---------------------------------------------------------------------------
// Mapa de rótulos PT — chaves EN canônicas → label exibição PT-BR
// ---------------------------------------------------------------------------
const CATEGORY_MAP = {
  strength:              'Força',
  cardio:                'Cardio',
  stretching:            'Alongamento',
  plyometrics:           'Pliometria',
  powerlifting:          'Powerlifting',
  'olympic weightlifting': 'Levantamento Olímpico',
  strongman:             'Strongman',
};
const EQUIPMENT_MAP = {
  'body only':     'Peso do Corpo',
  barbell:         'Barra',
  dumbbell:        'Halteres',
  cable:           'Cabo',
  machine:         'Máquina',
  bands:           'Faixas Elásticas',
  kettlebells:     'Kettlebell',
  'e-z curl bar':  'Barra W',
  'exercise ball': 'Bola de Ginástica',
  'medicine ball': 'Bola Medicinal',
  'foam roll':     'Rolo de Espuma',
  other:           'Outro',
};
const LEVEL_MAP = {
  beginner:     'Iniciante',
  intermediate: 'Intermediário',
  expert:       'Avançado',
};
const MECHANIC_MAP = {
  compound:  'Composto',
  isolation: 'Isolado',
};
const FORCE_MAP = {
  push:   'Empurrar',
  pull:   'Puxar',
  static: 'Isométrico',
};
const MUSCLE_MAP = {
  abdominals:       'Abdômen',
  abductors:        'Abdutores',
  adductors:        'Adutores',
  biceps:           'Bíceps',
  calves:           'Panturrilhas',
  chest:            'Peito',
  forearms:         'Antebraços',
  glutes:           'Glúteos',
  hamstrings:       'Isquiotibiais',
  lats:             'Dorsais',
  'lower back':     'Lombar',
  'middle back':    'Meio das Costas',
  'upper back':     'Parte Superior das Costas',
  neck:             'Pescoço',
  quadriceps:       'Quadríceps',
  shoulders:        'Ombros',
  traps:            'Trapézio',
  triceps:          'Tríceps',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function esc(s) {
  if (s == null) return 'NULL';
  return `'${String(s).replace(/'/g, "''")}'`;
}
function escArr(arr) {
  if (!arr || arr.length === 0) return "'{}'";
  const items = arr.map(v =>
    `"${String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, "''")}"`
  ).join(',');
  return `'{${items}}'`;
}
async function fetchJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} — ${url}`);
  return r.json();
}
async function downloadImage(url, dest) {
  if (existsSync(dest)) return true;
  try {
    const r = await fetch(url);
    if (!r.ok) return false;
    const buf = Buffer.from(await r.arrayBuffer());
    await writeFile(dest, buf);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
console.log('⬇  Baixando datasets…');
const [enRaw, ptRaw] = await Promise.all([fetchJson(EN_URL), fetchJson(PT_URL)]);

const enMap = Object.fromEntries(enRaw.map(e => [e.id, e]));
const ptMap = Object.fromEntries(ptRaw.map(e => [e.id, e]));
const allIds = [...new Set([...Object.keys(enMap), ...Object.keys(ptMap)])];

await mkdir(LOCAL_DIR, { recursive: true });
if (DOWNLOAD_IMAGES) await mkdir(IMG_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// Merge
// ---------------------------------------------------------------------------
console.log(`🔀 Mergeando ${allIds.length} exercícios…`);

const rows = [];
const report = {
  total: 0,
  merged: 0,
  only_en: [],
  only_pt: [],
  name_not_translated: [],
  missing_img_0: [],
  missing_img_1: [],
};

let imgDone = 0;
for (const id of allIds) {
  report.total++;
  const en = enMap[id];
  const pt = ptMap[id];

  if (!en) { report.only_pt.push(id); continue; }
  if (!pt) { report.only_en.push(id); continue; }

  // Sinalizar nome não traduzido (igual ao EN)
  const nameUntranslated = pt.name === en.name;
  if (nameUntranslated) report.name_not_translated.push(id);

  // Imagens
  const img0path = en.images?.[0] ?? `${id}/0.jpg`;
  const img1path = en.images?.[1] ?? `${id}/1.jpg`;
  let img0url, img1url;

  if (DOWNLOAD_IMAGES) {
    const dest0 = join(IMG_DIR, img0path.replace(/\//g, '_'));
    const dest1 = join(IMG_DIR, img1path.replace(/\//g, '_'));
    const ok0 = await downloadImage(`${IMG_BASE}${img0path}`, dest0);
    const ok1 = await downloadImage(`${IMG_BASE}${img1path}`, dest1);
    if (!ok0) report.missing_img_0.push(id);
    if (!ok1) report.missing_img_1.push(id);
    img0url = ok0 ? `/uploads/exercises/${img0path.replace(/\//g, '_')}` : null;
    img1url = ok1 ? `/uploads/exercises/${img1path.replace(/\//g, '_')}` : null;
    imgDone++;
    if (imgDone % 50 === 0) process.stdout.write(`  imagens: ${imgDone}/${allIds.length}\r`);
  } else {
    img0url = `${IMG_BASE}${img0path}`;
    img1url = `${IMG_BASE}${img1path}`;
  }

  rows.push({ id, en, pt, img0url, img1url, nameUntranslated });
  report.merged++;
}

// ---------------------------------------------------------------------------
// SQL — migration apenas cria tabela; seeder insere dados
// ---------------------------------------------------------------------------
console.log('📄 Gerando SQL…');

const insertRows = rows.map(({ id, en, pt, img0url, img1url }) => {
  const primary   = (en.primaryMuscles   || []).map(m => m.toLowerCase());
  const secondary = (en.secondaryMuscles || []).map(m => m.toLowerCase());
  return `  (${[
    esc(id),
    esc(pt.name),
    esc(en.name),
    esc(en.category   || null),
    esc(en.equipment  || null),
    esc(en.level      || null),
    esc(en.mechanic   || null),
    esc(en.force      || null),
    escArr(primary),
    escArr(secondary),
    escArr(pt.instructions || []),
    esc(img0url),
    esc(img1url),
  ].join(', ')})`;
}).join(',\n');

const seedSql = `-- Banco de exercícios PT-BR (${rows.length} exercícios)
-- Gerado por scripts/build-exercise-db.mjs
-- Fontes: yuhonas/free-exercise-db (Unlicense) + joao-gugel/exercicios-bd-ptbr
-- NÃO editar manualmente — reger via build-exercise-db.mjs

INSERT INTO public.exercises (
  id, name_pt, name_en, category, equipment, level, mechanic, force,
  primary_muscles, secondary_muscles, instructions_pt, image_0_url, image_1_url
) VALUES
${insertRows}
ON CONFLICT (id) DO UPDATE SET
  name_pt           = EXCLUDED.name_pt,
  name_en           = EXCLUDED.name_en,
  category          = EXCLUDED.category,
  equipment         = EXCLUDED.equipment,
  level             = EXCLUDED.level,
  mechanic          = EXCLUDED.mechanic,
  force             = EXCLUDED.force,
  primary_muscles   = EXCLUDED.primary_muscles,
  secondary_muscles = EXCLUDED.secondary_muscles,
  instructions_pt   = EXCLUDED.instructions_pt,
  image_0_url       = EXCLUDED.image_0_url,
  image_1_url       = EXCLUDED.image_1_url;
`;

// ---------------------------------------------------------------------------
// Mapa de enums PT (para revisão humana)
// ---------------------------------------------------------------------------
const enumMap = { category: CATEGORY_MAP, equipment: EQUIPMENT_MAP, level: LEVEL_MAP, mechanic: MECHANIC_MAP, force: FORCE_MAP, muscle: MUSCLE_MAP };

// ---------------------------------------------------------------------------
// Relatório
// ---------------------------------------------------------------------------
const notTranslatedList = report.name_not_translated.map(id => `- \`${id}\` — "${enMap[id]?.name}" (nome EN usado como PT)`).join('\n');
const coverageReport = `# Relatório de cobertura — banco de exercícios

Gerado em: ${new Date().toISOString()}

| Métrica | Valor |
|---------|-------|
| Total de IDs únicos | ${report.total} |
| Mergeados com sucesso | ${report.merged} |
| Só no dataset EN | ${report.only_en.length} |
| Só no dataset PT | ${report.only_pt.length} |
| Nomes não traduzidos (EN=PT) | ${report.name_not_translated.length} |
| Imagens 0.jpg ausentes | ${report.missing_img_0.length} |
| Imagens 1.jpg ausentes | ${report.missing_img_1.length} |
| Modo de imagem | ${DOWNLOAD_IMAGES ? 'local (download)' : 'URL raw (dev)'} |

## Nomes não traduzidos (${report.name_not_translated.length})

Estes exercícios têm o mesmo nome em EN e PT — são nomes estrangeiros já incorporados
ao vocabulário técnico (kettlebell, deadlift etc.) ou traduções faltando no repo PT.
Mantidos como estão; não requerem revisão urgente.

${notTranslatedList || '_nenhum_'}

## Só no dataset EN
${report.only_en.length ? report.only_en.map(id => `- \`${id}\``).join('\n') : '_nenhum_'}

## Só no dataset PT
${report.only_pt.length ? report.only_pt.map(id => `- \`${id}\``).join('\n') : '_nenhum_'}
`;

// ---------------------------------------------------------------------------
// Créditos
// ---------------------------------------------------------------------------
const credits = `# Créditos — banco de exercícios

## yuhonas/free-exercise-db

- Repositório: https://github.com/yuhonas/free-exercise-db
- Licença: **Unlicense (domínio público)** — uso comercial liberado, sem restrições.
- Uso: estrutura de dados, imagens e campos de enum canônicos (EN).

## joao-gugel/exercicios-bd-ptbr

- Repositório: https://github.com/joao-gugel/exercicios-bd-ptbr
- Licença: **sem licença formal** — utilizado com atribuição e risco aceito.
- Uso: nomes e instruções em português brasileiro (PT-BR).

Este banco derivado é de uso exclusivo do projeto Actus.
Não republicar os dados sem avaliar os termos originais.
`;

// ---------------------------------------------------------------------------
// Escrever arquivos
// ---------------------------------------------------------------------------
await Promise.all([
  writeFile(join(LOCAL_DIR, 'seed-exercises.sql'), seedSql),
  writeFile(join(LOCAL_DIR, 'exercise-enum-map-pt.json'), JSON.stringify(enumMap, null, 2)),
  writeFile(join(LOCAL_DIR, 'exercises-coverage.md'), coverageReport),
  writeFile(join(LOCAL_DIR, 'CREDITS-exercises.md'), credits),
]);

console.log(`\n✅ Concluído!`);
console.log(`   ${report.merged} exercícios → local/seed-exercises.sql`);
console.log(`   mapa EN→PT  → local/exercise-enum-map-pt.json`);
console.log(`   relatório   → local/exercises-coverage.md`);
console.log(`   créditos    → local/CREDITS-exercises.md`);
if (report.name_not_translated.length) {
  console.log(`   ⚠  ${report.name_not_translated.length} nomes não traduzidos (ver coverage report)`);
}
