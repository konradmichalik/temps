/// <reference types="svelte" />
/// <reference types="vite/client" />

/** Injected from package.json at build time (see vite*.config.ts). */
declare const __APP_VERSION__: string;

declare module 'weather-iconic/sprites' {
  const url: string;
  export default url;
}
declare module '@tauri-apps/plugin-http';
