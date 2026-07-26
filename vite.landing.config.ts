import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// Landing page build for GitHub Pages (konradmichalik.github.io/temps).
// The hero embeds the real app (same Svelte components, browser-fetch path),
// so the live demo needs no separate implementation.
export default defineConfig({
  plugins: [svelte()],
  root: resolve(__dirname, 'src/landing'),
  publicDir: resolve(__dirname, 'public'),
  base: '/temps/',
  build: {
    outDir: resolve(__dirname, 'dist-pages'),
    emptyOutDir: true,
    rollupOptions: {
      // Optional in the app build; never needed on the web (browser fetch).
      external: ['@tauri-apps/plugin-http'],
    },
  },
});
