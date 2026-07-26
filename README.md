<h1 align="center">temps</h1>

<h4 align="center">A simple but smart menubar weather app — rebuilt.</h4>

> [!NOTE]
> This is the v2 rebuild of [temps (2016)](https://github.com/konradmichalik/temps-legacy):
> Tauri 2 + Svelte 5 instead of Electron, [Open-Meteo](https://open-meteo.com) instead of
> API keys, [weather-iconic](https://github.com/konradmichalik/weather-iconic) multi-color icons.

## Status

Phase 1 (Tauri shell) landed on top of the Phase 2–4 frontend scaffold. The
popover now runs as a native macOS menubar app — see `docs/implementation-plan.md`
and `CLAUDE.md`. Repo migration (Phase 0) is manual and tracked in the plan.

Native shell (`src-tauri/`, macOS):
- NSPanel popover (frameless, 340×480) floating at the tray, click-outside to close
- Tray icon (template image) with optional temperature text + opt-in color dot
- Left-click toggles the popover; right-click menu: Refresh · Settings · Quit
- Global toggle shortcut (⌘⇧W), autostart, plugin-store persistence
- Rust refresh heartbeat → `refresh` events; rain-alert notification (opt-in, tested)

Implemented and tested:
- `utils/temp-color.ts` — the original 9-color temperature palette (design DNA)
- `utils/wmo-icons.ts` — WMO code → weather-iconic mapping (day/night, labels EN/DE, effects)
- `services/moon-phase.ts` — synodic moon phase → 8 icons, validated against real full/new moons
- `services/open-meteo.ts` — one request feeds all three screens, `timezone=auto`
- `utils/fetch.ts` — Tauri plugin-http vs. browser fetch (enables the landing live demo)
- Three-screen scroll-snap carousel (Overview · Hourly · Details), Cmd+D / arrow cycling
- Hand-rolled SVG hourly chart (Catmull-Rom, dashoffset reveal, gliding tooltip)
- Fixed effects layer: rain / snow / thunder + drifting wave silhouette
- Demo scenarios (`?demo=sunny|rain|snow|thunder|night`) — also the offline fallback
- Precipitation nowcast strip (minutely_15, "rain in ~20 min") with tested logic
- Settings overlay with integrated city search (Open-Meteo geocoding, debounced),
  favorites (max 5, persisted), unit / language / time format / effects toggles
- Locale + unit autodetect from `navigator.language`; choices persist to localStorage
- Deep links in the standalone app (`?lat=&lon=&name=`), URL stays in sync
- v1.1: air quality (European AQI) + pollen tiles (Europe only), sun position arc

## Development

```bash
npm install
npm run dev        # web preview with demo harness
npm run tauri:dev  # full macOS app (tray + popover) — needs the Rust toolchain
npm run test       # vitest (28 tests)
npm run check      # svelte-check
npm run build      # production web build
npm run tauri:build # .app + .dmg → src-tauri/target/release/bundle/
```

The dev preview hits the real Open-Meteo API; without network it falls back
to demo data automatically.

## Deployment targets

One codebase, three shells (all through `utils/fetch.ts`):

| Target | Entry | Notes |
|---|---|---|
| Tauri popover | `Popover.svelte` (via `main.ts` when `isTauri()`) | fixed 340x480 at the tray |
| Landing demo / dev harness | `index.html` | card + scenario switcher |
| Standalone web app | `app.html` | responsive, installable (manifest, `display: standalone`), edge-to-edge on mobile with safe-area insets, theme-color follows the temperature color, geolocation button |

Type scales with the card via container queries (`cqw`), so popover,
phone and desktop card share identical proportions.

## Credits

Weather data by [Open-Meteo.com](https://open-meteo.com) (CC BY 4.0).
Icons: [weather-iconic](https://github.com/konradmichalik/weather-iconic).

## License

MIT
