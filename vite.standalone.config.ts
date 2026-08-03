import { readFileSync, renameSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const version = JSON.parse(
  readFileSync(resolve(__dirname, 'package.json'), 'utf8'),
).version as string;

const outDir = resolve(__dirname, 'dist-pages/app');

// Standalone web app for GitHub Pages, served under /temps/app/. Built into a
// subfolder of the landing output (dist-pages) so the Pages workflow ships both
// from one artifact. app.html is emitted as index.html so the URL is /temps/app/.
export default defineConfig({
  plugins: [
    svelte(),
    {
      name: 'app-html-as-index',
      closeBundle() {
        const from = resolve(outDir, 'app.html');
        if (existsSync(from)) renameSync(from, resolve(outDir, 'index.html'));
      },
    },
  ],
  define: { __APP_VERSION__: JSON.stringify(version) },
  base: '/temps/app/',
  publicDir: resolve(__dirname, 'public'),
  build: {
    outDir,
    emptyOutDir: true,
    rollupOptions: {
      external: ['@tauri-apps/plugin-http'],
      input: { app: resolve(__dirname, 'app.html') },
    },
  },
});
