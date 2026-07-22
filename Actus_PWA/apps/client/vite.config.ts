import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'node:url';

const src = fileURLToPath(new URL('./src', import.meta.url));

// Actus PWA — front único React Native rodando na web via react-native-web + Vite.
// IMPORTANTE (validado na Fase 0): usar @vitejs/plugin-react v4 + Vite 6.
// A v6/Vite 8 (Rolldown/oxc) ignora plugins Babel, e Unistyles/Reanimated exigem babel.
export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';
  // Carrega TODAS as env (prefixo '') para reproduzir o inline das EXPO_PUBLIC_* do app.
  const env = loadEnv(mode, process.cwd(), '');

  // Base da API: EXPO_PUBLIC_API_BASE_URL (mesmo nome que os call-sites do app usam).
  const apiBase = env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';

  return {
    plugins: [
      svgr(), // habilita `import X from './x.svg?react'` como componente DOM
      react({
        jsxRuntime: 'automatic',
        babel: {
          plugins: [
            ['react-native-unistyles/plugin', { root: 'src' }],
            'react-native-worklets/plugin', // Reanimated 4 — DEVE ser o último
          ],
        },
      }),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.png'],
        manifest: {
          name: 'Actus',
          short_name: 'Actus',
          description: 'Actus — treino, dieta e gestão para academias e personais.',
          theme_color: '#0B0B0C',
          background_color: '#0B0B0C',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          icons: [
            { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          // shell offline; o catálogo wger tem muitas imagens — limite generoso.
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,woff2,ttf}'],
        },
      }),
    ],

    define: {
      __DEV__: JSON.stringify(!isProd),
      'process.env.NODE_ENV': JSON.stringify(mode),
      global: 'globalThis',
      // env inline (equivale ao babel-plugin-transform-inline-environment-variables do app)
      'process.env.EXPO_PUBLIC_API_BASE_URL': JSON.stringify(apiBase),
      'process.env.EXPO_PUBLIC_API_BASE_URL_WEB': JSON.stringify(env.EXPO_PUBLIC_API_BASE_URL_WEB || apiBase),
      'process.env.EXPO_PUBLIC_SENTRY_DSN': JSON.stringify(env.EXPO_PUBLIC_SENTRY_DSN || ''),
      'process.env.EXPO_PUBLIC_DEV_BYPASS_AUTH': JSON.stringify(env.EXPO_PUBLIC_DEV_BYPASS_AUTH || ''),
      'process.env.EXPO_PUBLIC_DEV_TIPO': JSON.stringify(env.EXPO_PUBLIC_DEV_TIPO || ''),
    },

    resolve: {
      alias: [
        // Alias de path do app: `@/x` -> `src/x`.
        { find: /^@\/(.*)$/, replacement: `${src}/$1` },
        // react-native (exato) -> react-native-web. Subpaths continuam resolvendo.
        { find: /^react-native$/, replacement: 'react-native-web' },
        // Módulos nativos sem wrapper -> substitutos web.
        { find: /^react-native-linear-gradient$/, replacement: 'react-native-web-linear-gradient' },
        { find: /^react-native-bootsplash$/, replacement: `${src}/shims/bootsplash.ts` },
        { find: /^@react-native-community\/datetimepicker$/, replacement: `${src}/shims/datetimepicker.tsx` },
      ],
      // .web.* primeiro: resolve os wrappers .web.ts automaticamente.
      extensions: [
        '.web.tsx',
        '.web.ts',
        '.web.jsx',
        '.web.js',
        '.tsx',
        '.ts',
        '.jsx',
        '.js',
        '.json',
      ],
      dedupe: ['react', 'react-dom', 'react-native-web'],
    },

    optimizeDeps: {
      esbuildOptions: {
        resolveExtensions: ['.web.js', '.js', '.ts', '.tsx', '.jsx', '.json'],
        loader: { '.js': 'jsx' },
        define: { global: 'globalThis' },
      },
    },

    server: { port: 5173 },
  };
});
