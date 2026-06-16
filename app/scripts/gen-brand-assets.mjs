// Gera os assets de marca (ícone, adaptive icon, splash) a partir do símbolo SVG.
// Fonte: H:\Actus\Logos\logo-isolado-1.svg (símbolo "A" Actus em neon #CBFE00).
// Uso: node scripts/gen-brand-assets.mjs
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SVG_SRC = '/mnt/h/Actus/Logos/logo-isolado-1.svg';
const OUT = resolve(import.meta.dirname, '..', 'assets');
const BG = '#10252D'; // BG_LOWEST (fundo da marca)
const NEON = '#CBFE00';

const rawSvg = readFileSync(SVG_SRC, 'utf8');
// viewBox 2186 x 2393 → razão largura/altura
const RATIO = 2186 / 2393;

// Rasteriza o SVG (recolorindo o fill quando preciso) numa altura-alvo, em transparente.
function renderSymbol(heightPx, fill) {
  const svg = fill ? rawSvg.replace(/#CBFE00/gi, fill) : rawSvg;
  const w = Math.round(heightPx * RATIO);
  return sharp(Buffer.from(svg))
    .resize({ width: w, height: heightPx, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

// Canvas quadrado com o símbolo centralizado.
async function compose({ size, symbolHeight, background, fill, out }) {
  const symbol = await renderSymbol(symbolHeight, fill);
  const base = sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: background ?? { r: 0, g: 0, b: 0, alpha: 0 },
    },
  });
  await base
    .composite([{ input: symbol, gravity: 'center' }])
    .png()
    .toFile(resolve(OUT, out));
  console.log('✓', out, `(${size}x${size}, símbolo ${symbolHeight}px)`);
}

// 1) Ícone iOS/loja: neon sobre fundo escuro (sem transparência).
await compose({ size: 1024, symbolHeight: 560, background: BG, fill: NEON, out: 'icon.png' });

// 2) Adaptive foreground (Android): neon transparente, folga p/ máscara circular (~47% do canvas).
await compose({ size: 1024, symbolHeight: 480, background: null, fill: NEON, out: 'android-icon-foreground.png' });

// 3) Monochrome (ícone temático Android): silhueta branca transparente.
await compose({ size: 1024, symbolHeight: 480, background: null, fill: '#FFFFFF', out: 'android-icon-monochrome.png' });

// 4) Splash: símbolo neon transparente (o expo-splash-screen põe o fundo BG_LOWEST).
await compose({ size: 1024, symbolHeight: 820, background: null, fill: NEON, out: 'splash-icon.png' });

// 5) Favicon (web): neon sobre fundo escuro.
await compose({ size: 256, symbolHeight: 150, background: BG, fill: NEON, out: 'favicon.png' });

console.log('Assets de marca gerados em', OUT);
