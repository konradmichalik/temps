import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const version = JSON.parse(
  readFileSync(resolve(__dirname, 'package.json'), 'utf8'),
).version as string;

export default defineConfig({
  plugins: [svelte()],
  define: { __APP_VERSION__: JSON.stringify(version) },
  server: { port: 5199, strictPort: true },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
  build: {
    rollupOptions: {
      external: ['@tauri-apps/plugin-http'],
      input: {
        main: resolve(__dirname, 'index.html'),
        app: resolve(__dirname, 'app.html'),
      },
    },
  },
});
