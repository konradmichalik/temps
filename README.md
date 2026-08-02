<h1 align="center">temps</h1>

<h4 align="center">A simple but smart macOS menubar weather app — rebuilt.</h4>

> [!NOTE]
> **temps v2** is a ground-up rebuild of [temps (2016)](https://github.com/konradmichalik/temps-legacy):
> Tauri 2 + Svelte 5 instead of Electron, [Open-Meteo](https://open-meteo.com)
> instead of API keys, and multi-color [weather-iconic](https://github.com/konradmichalik/weather-iconic)
> icons. macOS only for now.

## ✨ Features

- **Three screens** via CSS scroll-snap — swipe, or `⌘D` / arrow keys:
  - **Overview** — current temperature, condition, and a 4-day forecast. Tap a
    day for a slide-up sheet with high/low and rain chance.
  - **Hourly** — a hand-rolled, full-bleed SVG temperature line (no chart
    library) with a gliding tooltip.
  - **Details** — wind, feels-like, humidity, pressure, UV, moon phase, air
    quality + pollen, and a full-width **day/night sun-position wave** centered
    on the current time.
- **Temperature-driven color** — the full-bleed background follows the original
  9-color palette (design DNA), with a soft wave silhouette at the color→white edge.
- **Ambient effects** — rain / snow / thunder on a fixed layer, plus a
  precipitation nowcast strip (“rain in ~20 min”).
- **Menubar at a glance** — the tray shows the live weather glyph (an adaptive
  template image) and the current temperature.
- **Tabbed settings** — keyboard-navigable city autocomplete, favorites (max 5),
  units (°C/°F), language (EN/DE), time format, effects, polling interval, rain
  alerts, autostart, and a GitHub-release update check.
- **No API keys, no tracking, no chart / carousel / date libraries.** Locale and
  unit autodetect from the browser; choices persist.

> [!TIP]
> No network? The app falls back to bundled demo data. You can also force a
> scenario with `?demo=sunny|rain|snow|thunder|night`.

## 🖥️ The menubar app

Native shell (`src-tauri/`, macOS):

- **NSPanel popover** — frameless 340×480, floats at the tray, click-outside to close.
- **Tray** — current weather glyph + temperature; left-click toggles the popover,
  right-click menu: Refresh · Settings · Quit.
- **Global shortcut** `⌘⇧W` to toggle · `⌘G` for your current location.
- **Autostart**, plugin-store persistence, and a Rust refresh heartbeat.
- **Rain alert** — opt-in native notification when rain is starting soon.
- **Update check** against the GitHub Releases API (no third-party services).

## 🚀 Getting started

```bash
npm install
npm run dev         # web preview with the demo harness
npm run tauri:dev   # full macOS app (tray + popover) — needs the Rust toolchain
npm run test        # vitest (35 tests)
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

## 🙌 Credits

Weather data by [Open-Meteo.com](https://open-meteo.com) (CC BY 4.0).
Icons: [weather-iconic](https://github.com/konradmichalik/weather-iconic).

## 📄 License

MIT
