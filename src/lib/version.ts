/** The app version, injected from package.json at build time. */
export const APP_VERSION: string =
  typeof __APP_VERSION__ === 'undefined' ? '0.0.0' : __APP_VERSION__;
