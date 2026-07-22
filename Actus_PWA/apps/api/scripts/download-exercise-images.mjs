// Baixa as imagens do free-exercise-db para web/public/exercises/
// e regera o seed SQL com paths locais (/exercises/{id}_0.jpg).
//
// Uso:
//   node scripts/download-exercise-images.mjs
//
// O diretório web/public/exercises/ deve estar no .gitignore do projeto.
// Depois de rodar o script, re-aplique o seed no banco local:
//   psql -h 127.0.0.1 -p 5433 -U actus -d actus < local/seed-exercises.sql

import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT       = join(__dirname, '..');
const LOCAL_DIR  = join(ROOT, 'local');
const WEB_PUBLIC = join(ROOT, '..', 'web', 'public', 'exercises');
const IMG_BASE   = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

const EN_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const PT_URL = 'https://raw.githubusercontent.com/joao-gugel/exercicios-bd-ptbr/main/exercises/exercises-ptbr-full-translation.json';

// ─── helpers ────────────────────────────────────────────────────────────────

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
    await writeFile(dest, Buffer.from(await r.arrayBuffer()));
    return true;
  } catch {
    return false;
  }
}

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

// ─── main ────────────────────────────────────────────────────────────────────

console.log('⬇  Baixando datasets…');
const [enRaw, ptRaw] = await Promise.all([fetchJson(EN_URL), fetchJson(PT_URL)]);

const enMap = Object.fromEntries(enRaw.map(e => [e.id, e]));
const ptMap = Object.fromEntries(ptRaw.map(e => [e.id, e]));

const ids = Object.keys(enMap).filter(id => ptMap[id]);

await mkdir(WEB_PUBLIC, { recursive: true });

console.log(`📸 Baixando ${ids.length * 2} imagens para web/public/exercises/…`);

let done = 0;
let fail = 0;
const rows = [];

// Processar em lotes de 10 para não sobrecarregar o GitHub
const BATCH = 10;
for (let i = 0; i < ids.length; i += BATCH) {
  const batch = ids.slice(i, i + BATCH);
  await Promise.all(batch.map(async id => {
    const en = enMap[id];
    const pt = ptMap[id];

    const img0path = en.images?.[0] ?? `${id}/0.jpg`;
    const img1path = en.images?.[1] ?? (en.images?.[0]?.replace('/0.', '/1.') ?? `${id}/1.jpg`);

    const file0 = join(WEB_PUBLIC, `${id}_0.jpg`);
    const file1 = join(WEB_PUBLIC, `${id}_1.jpg`);

    const [ok0, ok1] = await Promise.all([
      downloadImage(`${IMG_BASE}${img0path}`, file0),
      downloadImage(`${IMG_BASE}${img1path}`, file1),
    ]);

    if (!ok0) fail++;
    if (!ok1) fail++;

    const localUrl0 = ok0 ? `/exercises/${id}_0.jpg` : null;
    const localUrl1 = ok1 ? `/exercises/${id}_1.jpg` : null;

    const primary   = (en.primaryMuscles   || []).map(m => m.toLowerCase());
    const secondary = (en.secondaryMuscles || []).map(m => m.toLowerCase());

    rows.push({ id, en, pt, img0url: localUrl0, img1url: localUrl1 });
    done++;
  }));

  process.stdout.write(`  ${done}/${ids.length} (${fail} falhas)\r`);
}

console.log(`\n✅ ${done} exercícios processados, ${fail} imagens faltando.`);

// ─── regera seed SQL com paths locais ────────────────────────────────────────

console.log('📄 Regerando seed SQL com paths locais…');

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
-- Gerado por scripts/download-exercise-images.mjs — imagens em web/public/exercises/
-- NÃO editar manualmente

INSERT INTO public.exercises (
  id, name_pt, name_en, category, equipment, level, mechanic, force,
  primary_muscles, secondary_muscles, instructions_pt, image_0_url, image_1_url
) VALUES
${insertRows}
ON CONFLICT (id) DO UPDATE SET
  image_0_url = EXCLUDED.image_0_url,
  image_1_url = EXCLUDED.image_1_url;
`;

await writeFile(join(LOCAL_DIR, 'seed-exercises.sql'), seedSql);

console.log('');
console.log('Próximo passo — re-aplicar seed no banco local:');
console.log('  PGPASSWORD=actus psql -h 127.0.0.1 -p 5433 -U actus -d actus < local/seed-exercises.sql');
