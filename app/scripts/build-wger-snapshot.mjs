// Pipeline de snapshot do catálogo Wger (build-time).
//
// Baixa o catálogo público do Wger (wger.de) e gera assets bundláveis:
//   - assets/wger/catalog.json        (~851 exercícios, valida em WgerCatalogSchema)
//   - assets/wger/images/<id>.webp    (comprimidas ~400px; só quem tem imagem)
//   - assets/wger/images.ts           (require-map estático para o bundler RN)
//   - assets/wger/ATTRIBUTION.md       (crédito CC-BY-SA + generated_at)
//
// Fonte verificada (2026-06-08): o endpoint combinado /api/v2/exerciseinfo/
// devolve tudo numa varredura — por base: category{name}, equipment[{name}],
// muscles[{name}], translations[{name,description,language}], images[], videos[].
// `id` = id da exercise base (mesma chave usada por imagens e pelo backend).
//
// Uso: npm run wger:snapshot

import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { z } from 'zod';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'assets', 'wger');
const IMG_DIR = join(OUT_DIR, 'images');

const API = 'https://wger.de/api/v2';
const SOURCE = 'https://wger.de';
const LANG_EN = 2;
const LANG_PT = 7;

// Cópia local do schema (espelha src/lib/wger/types.ts). Mantém o gerador
// independente do pipeline TS — validamos o catálogo antes de escrever.
const WgerExerciseSchema = z.object({
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
const WgerCatalogSchema = z.object({
  generated_at: z.string(),
  source: z.string(),
  exercises: z.array(WgerExerciseSchema),
});

const stripHtml = (html) =>
  (html ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || null;

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'actus-app-snapshot/1.0' },
  });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status} ${res.statusText}`);
  return res.json();
}

// Pagina por um endpoint paginado DRF e devolve todos os results.
async function fetchAll(path, limit = 100) {
  let url = `${API}/${path}?format=json&limit=${limit}`;
  const all = [];
  let pages = 0;
  while (url) {
    const data = await fetchJson(url);
    all.push(...data.results);
    url = data.next;
    pages += 1;
    if (pages % 2 === 0) process.stdout.write(`\r  ${path}: ${all.length}/${data.count}   `);
  }
  process.stdout.write(`\r  ${path}: ${all.length} itens          \n`);
  return all;
}

function pickName(translations, lang) {
  const t = translations.find((x) => x.language === lang && x.name && x.name.trim());
  return t ? t.name.trim() : null;
}
function pickDescription(translations, lang) {
  const t = translations.find((x) => x.language === lang);
  return t ? stripHtml(t.description) : null;
}

async function downloadImage(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'actus-app-snapshot/1.0' } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  const startedAt = new Date();
  console.log('Wger snapshot — baixando catálogo combinado (/exerciseinfo/)...');

  const bases = await fetchAll('exerciseinfo'); // ~851 bases, tudo aninhado

  const exercises = [];
  const withImage = []; // { id, url }
  let skippedNoName = 0;

  for (const base of bases) {
    const translations = Array.isArray(base.translations) ? base.translations : [];
    const name_pt = pickName(translations, LANG_PT);
    const name_en = pickName(translations, LANG_EN);

    // Pula bases sem nome em PT nem EN.
    if (!name_pt && !name_en) {
      skippedNoName += 1;
      continue;
    }

    const images = Array.isArray(base.images) ? base.images : [];
    const mainImage = images.find((i) => i.is_main) ?? images[0];
    const videos = Array.isArray(base.videos) ? base.videos : [];

    const willHaveImage = Boolean(mainImage?.image);
    if (willHaveImage) withImage.push({ id: base.id, url: mainImage.image });

    exercises.push({
      id: base.id,
      name_pt,
      name_en,
      category: base.category?.name ?? '',
      equipment: (base.equipment ?? []).map((e) => e.name).filter(Boolean),
      muscles: [
        ...(base.muscles ?? []),
        ...(base.muscles_secondary ?? []),
      ]
        .map((m) => m.name_en || m.name)
        .filter(Boolean),
      description_pt: pickDescription(translations, LANG_PT),
      description_en: pickDescription(translations, LANG_EN),
      hasImage: willHaveImage, // ajustado p/ false se o download falhar
      hasVideo: videos.length > 0,
    });
  }

  console.log(
    `Processados ${exercises.length} exercícios (${skippedNoName} pulados sem nome). ` +
      `${withImage.length} têm imagem.`,
  );

  // Prepara diretórios de saída (limpa imagens antigas).
  await rm(IMG_DIR, { recursive: true, force: true });
  await mkdir(IMG_DIR, { recursive: true });

  // Baixa + comprime imagens (concorrência limitada, educada com o servidor).
  console.log('Baixando e comprimindo imagens (~400px webp)...');
  const byId = new Map(exercises.map((e) => [e.id, e]));
  const CONCURRENCY = 6;
  let okImages = 0;
  let failImages = 0;
  let done = 0;

  let cursor = 0;
  async function worker() {
    while (cursor < withImage.length) {
      const idx = cursor++;
      const { id, url } = withImage[idx];
      try {
        const buf = await downloadImage(url);
        await sharp(buf)
          .resize({ width: 400, withoutEnlargement: true })
          .webp({ quality: 72 })
          .toFile(join(IMG_DIR, `${id}.webp`));
        okImages += 1;
      } catch (err) {
        failImages += 1;
        const ex = byId.get(id);
        if (ex) ex.hasImage = false;
        console.warn(`\n  ! imagem falhou base ${id}: ${err.message}`);
      }
      done += 1;
      if (done % 20 === 0) process.stdout.write(`\r  imagens: ${done}/${withImage.length}   `);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  process.stdout.write(`\r  imagens: ${done}/${withImage.length}          \n`);

  // Catálogo final + validação Zod (falha alto se inválido).
  const catalog = {
    generated_at: startedAt.toISOString(),
    source: SOURCE,
    exercises: exercises.sort((a, b) => a.id - b.id),
  };
  WgerCatalogSchema.parse(catalog);
  console.log('Catálogo validou contra WgerCatalogSchema.');

  await writeFile(join(OUT_DIR, 'catalog.json'), JSON.stringify(catalog, null, 2) + '\n', 'utf8');

  // Require-map estático (Metro precisa de require() literais).
  const idsWithImage = exercises
    .filter((e) => e.hasImage)
    .map((e) => e.id)
    .sort((a, b) => a - b);
  const mapLines = idsWithImage.map((id) => `  ${id}: require('./images/${id}.webp'),`).join('\n');
  const imagesTs =
    `// GERADO por scripts/build-wger-snapshot.mjs — não editar à mão.\n` +
    `import type { ImageSourcePropType } from 'react-native';\n\n` +
    `export const WGER_IMAGES: Record<number, ImageSourcePropType> = {\n` +
    `${mapLines}\n};\n`;
  await writeFile(join(OUT_DIR, 'images.ts'), imagesTs, 'utf8');

  // Atribuição CC-BY-SA.
  const attribution =
    `# Atribuição — Catálogo Wger\n\n` +
    `Os dados de exercícios e as imagens em \`assets/wger/\` foram obtidos da\n` +
    `[Wger Workout Manager](https://wger.de) via a API pública v2.\n\n` +
    `Licença: **CC-BY-SA 4.0** (Creative Commons Attribution-ShareAlike 4.0).\n` +
    `https://creativecommons.org/licenses/by-sa/4.0/\n\n` +
    `- Fonte: ${SOURCE}\n` +
    `- Gerado em: ${startedAt.toISOString()}\n` +
    `- Exercícios: ${catalog.exercises.length}\n` +
    `- Imagens: ${idsWithImage.length}\n\n` +
    `Gerado por \`scripts/build-wger-snapshot.mjs\` (\`npm run wger:snapshot\`).\n`;
  await writeFile(join(OUT_DIR, 'ATTRIBUTION.md'), attribution, 'utf8');

  const withVideo = catalog.exercises.filter((e) => e.hasVideo).length;
  console.log(
    `\nPRONTO: ${catalog.exercises.length} exercícios · ${idsWithImage.length} imagens ` +
      `(${failImages} falhas) · ${withVideo} com vídeo.`,
  );
}

main().catch((err) => {
  console.error('\nFALHA no snapshot:', err);
  process.exit(1);
});
