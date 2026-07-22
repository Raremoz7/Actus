import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Build isolado da landing page para GitHub Pages (repo de projeto Actus-site).
// `base` pode ser sobrescrito por env (ex.: ACTUS_BASE=/ para domínio próprio).
const base = process.env.ACTUS_BASE ?? '/Actus-site/';

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist-landing',
    emptyOutDir: true,
    rollupOptions: {
      input: 'landing.html',
    },
  },
});
