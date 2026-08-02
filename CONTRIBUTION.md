# Contributing to temps

Thanks for helping out! This covers local development, the build targets, and a
few architecture notes.

## 🚀 Getting started

```bash
npm install
npm run dev         # web preview with the demo harness
npm run tauri:dev   # full macOS app (tray + popover) — needs the Rust toolchain
npm run test        # vitest
npm run check       # svelte-check
npm run lint        # eslint + prettier --check
npm run build       # production web build
npm run build:pages # landing page → dist-pages/ (GitHub Pages)
npm run tauri:build # .app + .dmg → src-tauri/target/release/bundle/
```

> [!IMPORTANT]
> The dev preview hits the live Open-Meteo API. Attribution (**CC BY 4.0**) is
> mandatory and is surfaced in-app and on the landing page — keep it intact.

## 🎯 One codebase, four shells

Everything shares one component tree and routes network through `utils/fetch.ts`
(Tauri `plugin-http` in the app, browser `fetch` on the web):

| Target | Entry | Notes |
|---|---|---|
| Tauri popover | `Popover.svelte` (`main.ts` when `isTauri()`) | fixed 340×480 at the tray |
| Dev harness | `index.html` | card + scenario switcher (browser) |
| Standalone web app | `app.html` | responsive & installable (PWA manifest), edge-to-edge on mobile, theme-color follows the temperature, geolocation button |
| Landing page | `src/landing/` → `dist-pages/` | live hero demo + install/shortcuts/credits |

Type scales with the card via container queries (`cqw`), so popover, phone, and
desktop card share identical proportions.

## 🧭 Design notes

- **One request feeds all three screens** (`services/open-meteo.ts`, `timezone=auto`);
  display always uses the location's timezone, never the system's.
- **No chart library** — the hourly line is Catmull-Rom smoothing with a
  dashoffset reveal and a pointer-driven tooltip.
- **Effects and waves live on a fixed layer** between the background color and
  the scroll-snap container; only `transform` / `opacity` animate, and
  `prefers-reduced-motion` is respected.
- **Tested pure modules** — `tempToColor`, `wmoToIcon`, `moonPhase`, the rain-alert
  debounce, nowcast analysis, and update-version comparison.
