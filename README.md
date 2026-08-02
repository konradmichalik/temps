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

## 🛠️ Contributing

Development setup, build targets, and architecture notes live in
[CONTRIBUTION.md](CONTRIBUTION.md).

## 🙌 Credits

Weather data by [Open-Meteo.com](https://open-meteo.com) (CC BY 4.0).
Icons: [weather-iconic](https://github.com/konradmichalik/weather-iconic).

## 📄 License

MIT
