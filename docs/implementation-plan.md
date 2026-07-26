# temps (v2) — Implementierungsplan & Claude-Code-Prompt

> **Projektauftrag:** Baue `temps` neu — eine minimalistische macOS-Menubar-Wetter-App als komplette Neuauflage des Originals von 2016 (jetzt [temps-legacy](https://github.com/konradmichalik/temps-legacy)). Architektur-Basis ist [beacon](https://github.com/konradmichalik/beacon) (Tauri 2 + Svelte 5 + Tailwind 4). Icons kommen aus [weather-iconic](https://github.com/konradmichalik/weather-iconic) in der Multi-Color-Variante. Wetterdaten von Open-Meteo (kein API-Key). Optisches Vorbild: `temps-legacy/assets/screenshot-overview.png`.

---

> **Status:** Phasen 2, 3 und Teile von 4 sind im Frontend-Workspace umgesetzt
> (Screens, Carousel, Chart, Effekte, animierte Wellen, Nowcast, Settings +
> Suche, Favoriten, Deep Links, Standalone-Web-App, v1.1 AQI/Pollen +
> Sonnenbogen). **Phase 1 (Tauri-Shell) ist umgesetzt:** `src-tauri/` mit
> NSPanel-Popover (Swizzle wie beacon), Tray (Template-Icon, Temp-Text,
> opt-in Farb-Dot, Kontextmenü), Global-Shortcut ⌘⇧W, Autostart,
> plugin-store-Persistenz (`storage.ts` async, localStorage-Fallback im Web),
> Rust-Refresh-Heartbeat (`polling.rs`) → `refresh`-Events, Regen-Notification
> (`services/rain-alert.ts` pure + getestet, `stores/rain-alert.svelte.ts`).
> Popover-Entry: `main.ts` verzweigt auf `isTauri()` → `Popover.svelte`.
> **Phase 4 komplett:** das volle Shortcut-Schema (⌘⇧W/⌘D/⌘F/⌘G/⌘W/⌘E/⌘R/⌘Q/⌘1–5,
> `utils/cities.ts`, `weather.locate()`), im Web auf browser-sichere Shortcuts
> reduziert. **Phase 5 (Landing) umgesetzt:** `vite.landing.config.ts` +
> `src/landing/` (Live-AppCard-Hero, Feature-Strip, Shortcut-Übersicht, Credits),
> Build via `npm run build:pages` → `dist-pages/` (base `/temps/`).
> Offen: Phase 0 (manuelle Repo-Migration), Phase 5 Ship-Reste (CI-Workflows,
> Homebrew-Cask, Notarisierung/Signierung), sowie der Live-GUI-Feinschliff
> (Popover-Positionierung/Effekte am echten Tray, Icon-Sichtprüfung).
> Abweichungen vom Plan: (1) Tailwind zugunsten von Scoped CSS + Design-Tokens
> weggelassen. (2) Polling bleibt bewusst schlank — die Wetter-Logik lebt in den
> getesteten TS-Services; Rust liefert nur den Heartbeat. (3) Settings bleiben
> ein In-Popover-Overlay (kein zweites Fenster wie bei beacon).

## 0. Repo-Migration (manuell, vor dem ersten Commit)

Reihenfolge ist wichtig, damit die GitHub-Redirects wie gewünscht landen:

1. **OWM-API-Key revoken** — der Key liegt committed in `src/main/config.json` des alten Repos (ebenso ein Google-Maps-Key). Beide bei den Anbietern invalidieren, unabhängig davon, ob sie noch funktionieren.
2. **Altes Repo umbenennen:** `konradmichalik/temps` → `konradmichalik/temps-legacy`. GitHub legt einen Redirect `temps → temps-legacy` an.
3. **Legacy-README anpassen** (ein letzter Commit vor der Archivierung): Hinweis-Block ganz oben — „temps lives on: dieses Repo ist das Original von 2016, die aktive Neuauflage findest du unter [konradmichalik/temps](https://github.com/konradmichalik/temps)." Die bestehenden Fork-Verweise (musicpro, GirkovArpa) stehen lassen. Danach Repo **archivieren**.
4. **Neues Repo `konradmichalik/temps` anlegen.** In dem Moment stirbt der Redirect aus Schritt 2 — alte Links auf `konradmichalik/temps` (und via Kette auch `jackd248/temps`) zeigen ab jetzt auf die Neuauflage. Das ist hier gewollt: Besucher alter Links landen beim Nachfolger. **Einziger Bruch:** Deep-Links auf alte Release-Assets (`/temps/releases/download/...`) laufen ins Leere → deshalb der Hinweis-Block in Schritt 3, der auf `temps-legacy/releases` verweist.
5. **Bestehende Referenzen nachziehen:** weather-iconic-README („Originally made for the weather app temps") auf die neue Landing-URL umbiegen, sobald sie live ist; alte GitHub-Pages-Site des Originals (falls auf gh-pages-Branch) wandert mit nach `temps-legacy` und wird von der neuen Landing unter `konradmichalik.github.io/temps` abgelöst.
6. **Naming im Code:** Produktname `Temps`, Bundle-Identifier `eu.konradmichalik.temps` (nicht den alten Electron-Identifier wiederverwenden), Homebrew-Cask `temps`, Version startet bei `2.0.0-beta.1` — die Versionierung erzählt die Geschichte weiter (Original endete bei 0.7.0, die 2.x markiert den Neubau unmissverständlich).

---

## 1. Projekt-Setup

- **Repo:** `konradmichalik/temps` (nach Migration aus Abschnitt 0), MIT-Lizenz
- **Vorgehen:** beacon-Repo als struktureller Ausgangspunkt (kein Fork — frisches Repo, Struktur und generische Teile übernehmen)
- **Stack:** Tauri 2, Svelte 5 (Runes), TypeScript, Tailwind 4, Vite 7, Vitest
- **Tauri-Plugins:** `plugin-http`, `plugin-store`, `plugin-global-shortcut`, `plugin-notification`, `plugin-shell` (für externe Links), Autostart via `tauri-plugin-autostart`
- **Fenster:** frameless, transparent, `alwaysOnTop`, `skipTaskbar`, ~340×480 px (Popover-Format des Originals, schmaler als beacons 420 px), NSPanel-Subclass aus beacons `lib.rs` übernehmen (`canBecomeKeyWindow`-Override für Keyboard-Input)
- **Dependency-Policy:** keine Chart-Library, keine Carousel-Library, kein moment/dayjs (native `Intl`), keine jQuery-Altlasten

### Verzeichnisstruktur

```
src/
  App.svelte
  lib/
    components/
      layout/        TrayPopup.svelte, Carousel.svelte, DotsIndicator.svelte
      screens/       OverviewScreen.svelte, HourlyScreen.svelte, DetailsScreen.svelte
      effects/       EffectsLayer.svelte, Rain.svelte, Snow.svelte, Thunder.svelte, Waves.svelte
      ui/            WeatherIcon.svelte, TempDisplay.svelte, ForecastRow.svelte,
                     HourlyChart.svelte, CitySearch.svelte, Toast.svelte
      settings/      SettingsView.svelte
    services/        open-meteo.ts, geocoding.ts, air-quality.ts, moon-phase.ts,
                     update-check.ts, rain-alert.ts
    stores/          weather.svelte.ts, location.svelte.ts, favorites.svelte.ts,
                     settings.svelte.ts, toast.svelte.ts
    utils/           fetch.ts, wmo-icons.ts, temp-color.ts, time.ts, storage.ts
src-tauri/
  src/               lib.rs, main.rs, tray.rs, polling.rs
src/landing/         Landing.svelte (+ vite.landing.config.ts)
```

---

## 2. Datenquelle: Open-Meteo

Kein API-Key, non-commercial free (10k Calls/Tag), **Attribution CC BY 4.0 verpflichtend** (Landingpage + About/Settings: „Weather data by Open-Meteo.com").

### Haupt-Request (ein Call deckt alle drei Screens)

```
GET https://api.open-meteo.com/v1/forecast
  ?latitude={lat}&longitude={lon}
  &current=temperature_2m,apparent_temperature,relative_humidity_2m,
           weather_code,is_day,wind_speed_10m,wind_direction_10m,
           surface_pressure,uv_index
  &hourly=temperature_2m,weather_code,precipitation_probability
  &daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,
         uv_index_max,precipitation_probability_max
  &minutely_15=precipitation
  &forecast_days=5
  &timezone=auto
  &temperature_unit={celsius|fahrenheit}
```

- `timezone=auto` ersetzt die alte Google-Timezone-API vollständig (Antwort enthält `timezone` + `utc_offset_seconds` → Anzeige der Ortszeit wie im Original oben rechts)
- `minutely_15.precipitation` speist die Regen-Notification (Feature 10.5)
- Polling-Intervall: Setting, Default 15 min (Original: 5 min — unnötig aggressiv), Refresh bei Popover-Öffnung wenn Daten > 5 min alt

### Geocoding (Stadtsuche)

```
GET https://geocoding-api.open-meteo.com/v1/search?name={query}&count=6&language={de|en}
```

Debounced (300 ms) in `CitySearch.svelte`, Ergebnis: Name, Land-Code, lat/lon, timezone. „Find my location" (Cmd+G) über `navigator.geolocation` im Webview, Fallback: IP-frei lassen, kein Third-Party-Geo-Dienst.

### Luftqualität & Pollen (v1.1, eigener Service, lazy geladen)

```
GET https://air-quality-api.open-meteo.com/v1/air-quality
  ?latitude={lat}&longitude={lon}
  &current=european_aqi,pm2_5,alder_pollen,birch_pollen,grass_pollen,
           mugwort_pollen,olive_pollen,ragweed_pollen
```

Pollen nur in Europa verfügbar → Feld-Präsenz prüfen, außerhalb Europas Kachel ausblenden.

### Fetch-Abstraktion (`utils/fetch.ts`)

Eine Signatur, zwei Backends: Tauri-Build nutzt `@tauri-apps/plugin-http`, Web-/Landing-Build nutzt Browser-`fetch` (Open-Meteo ist CORS-offen). Erkennung über `window.__TAURI__ !== undefined`. Diese Abstraktion ist die Voraussetzung für die Live-Demo auf der Landingpage.

---

## 3. WMO-Code → weather-iconic Mapping (`utils/wmo-icons.ts`)

Signatur: `wmoToIcon(code: number, isDay: boolean): IconName`

| WMO | Bedeutung | Tag | Nacht |
|---|---|---|---|
| 0 | Klar | `sun` | `moon` |
| 1 | Überwiegend klar | `sun-high` | `moon` |
| 2 | Teils bewölkt | `sun-cloud` | `moon-cloud` |
| 3 | Bedeckt | `clouds` | `clouds` |
| 45, 48 | Nebel / Reifnebel | `sun-fog` / `fog` | `moon-fog` / `fog` |
| 51, 53, 55 | Niesel (leicht–stark) | `cloud-rain-alt` | `cloud-rain-alt` |
| 56, 57 | Gefrierender Niesel | `cloud-sleet` | `cloud-sleet` |
| 61, 63, 65 | Regen (leicht–stark) | `cloud-rain` | `cloud-rain` |
| 66, 67 | Gefrierender Regen | `cloud-sleet` | `cloud-sleet` |
| 71, 73, 75 | Schneefall (leicht–stark) | `cloud-snow` | `cloud-snow` |
| 77 | Schneegriesel | `cloud-snow-alt` | `cloud-snow-alt` |
| 80, 81, 82 | Regenschauer | `sun-cloud-rain` | `moon-cloud-rain` |
| 85, 86 | Schneeschauer | `sun-cloud-snow` | `moon-cloud-snow` |
| 95 | Gewitter | `sun-cloud-lightning` | `moon-cloud-lightning` |
| 96, 99 | Gewitter mit Hagel | `cloud-hail` | `cloud-hail` |
| Fallback | unbekannt | `na` | `na` |

Zusätzlich `wmoToLabel(code, locale)` für den Zustandstext („light rain") und `wmoToEffect(code): 'rain' | 'snow' | 'thunder' | null` für den Effekt-Layer (Regen: 51–67, 80–82; Schnee: 71–77, 85–86; Thunder: 95–99, kombiniert mit Rain-Effekt).

Details-Screen-Icons: `wind` + `compass-{n|ne|e|se|s|sw|w|nw}` (aus `wind_direction_10m`, 45°-Sektoren), `humidity`, `barometer`, `umbrella` (Regenwahrscheinlichkeit), `sunrise`, `sunset`, `sun-high` (UV), `thermometer-{cold|medium|hot}` (gefühlt, schwellenbasiert), Mondphase → siehe 10.3.

---

## 4. Farbsystem (`utils/temp-color.ts`)

Die 9er-Palette aus dem Original ist die Design-DNA — unverändert übernehmen:

```ts
export const TEMP_COLORS = [
  '#b1695a', // > 30 °C  (> 86 °F)
  '#DB9864', // > 26     (> 78)
  '#E3BB88', // > 22     (> 71)
  '#D0C7A8', // > 18     (> 64)
  '#B1C2A3', // > 14     (> 57)
  '#80BBB2', // > 10     (> 50)
  '#6D9E96', // > 6      (> 42)
  '#8F95A5', // > 2      (> 35)
  '#6F7685', // sonst
] as const;
export const ERROR_COLOR = '#444444';
```

- `tempToColor(temp, unit)` mit beiden Schwellen-Sets (metrisch/imperial wie in alter `color.js`)
- Hintergrund als abgeleiteter Store-State, Wechsel mit `transition: background-color 600ms ease`
- **Nachtmodus:** wenn `is_day === 0`, Hintergrundfarbe um ~35 % abdunkeln (HSL-Lightness), wie der dunkle New-York-Screen im Original-Screenshot
- Tailwind: Palette als Theme-Tokens (`--color-temp-0` … `--color-temp-8`) registrieren

## 5. Typografie & Grundlayout

- **Font: Rubik** (Original-Font), Light/Regular, selbst gehostet (kein Google-Fonts-CDN)
- Alles Weiß auf Farbfläche: große Temperatur ~72 px Rubik Light mit hochgestelltem `°`, Zustandstext darunter in Weiß mit ~70 % Opacity, feine Trennlinie dazwischen
- Header: Burger-/Settings-Icon links, Ortszeit (`HH:mm`, timezone-korrekt) rechts, jeweils weiß ~80 % Opacity
- Footer-Bereich (unter den Wellen, weißer Grund): Datum + Stadt in Grautönen, Forecast-Reihe mit Icons in der aktuellen Temperaturfarbe (wie Original: Icons unten sind farbig auf Weiß!)

---

## 6. Icon-Komponente (`WeatherIcon.svelte`)

- Rendert `<svg role="img" aria-label={name}><use href="{sprites}#weather-{name}" /></svg>` aus `weather-iconic/sprites` (npm-Paket `weather-iconic`)
- Multi-Color via CSS Custom Properties aus `weather-iconic-enhanced.css`:
  - Props: `name`, `size`, `primary`, `secondary`
  - **Auf Farbfläche (oberer Bereich):** `secondary: #fff` (Basis/Wolke weiß), `primary: rgba(255,255,255,0.75)` — dezente Zweifarbigkeit, bricht den Minimalismus nicht
  - **Auf Weiß (Forecast-Reihe, Details):** `secondary: aktuelle Temperaturfarbe`, `primary: um 12 % abgedunkelte Variante` der gleichen Farbe
- ⚠️ Der Multi-Color-Mechanismus hängt an `path:first-child` / `g:first-child` / `only-child`-Selektoren → **Sichtprüfung aller ~20 tatsächlich genutzten Icons** in beiden Kontexten (Task in Phase 2), Abweichungen ggf. per Icon-spezifischem CSS-Override lösen

---

## 7. Drei Screens als Carousel

### Container (`Carousel.svelte`)

- CSS Scroll-Snap: `scroll-snap-type: x mandatory`, jedes Screen-`<section>` mit `scroll-snap-align: start`, `overflow-x: auto` mit ausgeblendeter Scrollbar → natives Trackpad-Swiping im Tauri-Webview
- Dots-Indicator unten (3 Punkte, aktiver Punkt in Temperaturfarbe bzw. weiß je nach Zone), klickbar
- Aktiver Index via `IntersectionObserver`, programmatisches Wechseln mit `scrollTo({ behavior: 'smooth' })`
- **Cmd+D zykliert** durch die Screens (rückwärtskompatibel zum alten Shortcut), Pfeiltasten ←/→ ebenfalls
- Position bleibt beim Schließen/Öffnen des Popovers erhalten (Store)

### Screen 1 — Overview

Großes Icon + Temperatur + Zustand auf Farbfläche; unter den Wellen: Datum/Stadt-Zeile, darunter 4-Tage-Forecast (Wochentag-Kürzel, Icon, Max-Temp; Tap auf Tag → Tooltip mit Min/Max).

### Screen 2 — Hourly

Farbfläche mit kompaktem Icon+Temp-Header (kleiner als Overview), unterer Bereich: der Custom-SVG-Chart (Abschnitt 8) über die nächsten ~24 h.

### Screen 3 — Details

2-spaltiges Kachel-Grid auf weißem Grund (Farbfläche oben nur als schmales Band mit Icon+Temp): Wind (Speed + Kompass-Icon gedreht/gewählt nach Richtung), Gefühlt, Luftfeuchte, Luftdruck, Regenwahrscheinlichkeit, UV-Index, Sonnenauf-/-untergang, Mondphase (nachts prominenter). v1.1 ergänzt hier AQI + Pollen-Kacheln.

### Effekt-Layer (`EffectsLayer.svelte`) — kritische Architektur-Entscheidung

Effekte liegen als **fixierter Layer zwischen Hintergrundfarbe und Slide-Container** (`position: fixed; pointer-events: none; z-index` zwischen bg und content). So läuft Regen/Schnee beim Swipen durch und „reißt" nicht mit. Gleiches gilt für die **Wellen-Silhouette** (`Waves.svelte`): fixiert am Übergang Farbe→Weiß, 2–3 überlagerte SVG-Pfade mit 8–15 % Weiß-Opacity, sehr langsame horizontale Drift-Animation (60–90 s Loop).

- **Rain:** 40–60 absolut positionierte Drop-Elemente (schmale `div`s mit Gradient), zufällige `left`/`animation-delay`/`animation-duration`, CSS `@keyframes` fall + fade — moderne Fassung des Original-Ansatzes (`.drop`-Elemente), GPU-freundlich via `transform: translateY`
- **Snow:** analoge Flocken mit leichtem horizontalem Sinus-Drift (zwei kombinierte Keyframes), unterschiedliche Größen/Opacities für Tiefe
- **Thunder:** Rain-Effekt + zufällig getriggertes Vollflächen-Flash-Overlay (weiß, 80–120 ms, alle 6–14 s, `prefers-reduced-motion` respektieren → Effekte dann statisch/aus)

---

## 8. Hourly-Chart ohne Chart.js (`HourlyChart.svelte`)

- **Daten:** nächste 24 h `hourly.temperature_2m` + `weather_code`
- **Linie:** ein `<path>`, Punkte per Catmull-Rom → kubische Bézier geglättet, Stroke weiß (bzw. Temperaturfarbe, wenn Chart auf weißem Grund liegt — Original zeigt ihn auf Weiß unter den Wellen), `stroke-width: 2`
- **Einblende-Animation:** `stroke-dasharray`/`stroke-dashoffset`-Transition (~800 ms ease-out) beim Screen-Wechsel
- **Interaktion:** transparentes Overlay mit `pointermove`; nächstgelegener Datenpunkt als `$derived`; Marker-Punkt + Tooltip (weather-iconic-Icon + „20° / Mo, 14:00") gleiten per CSS-Transition (`transform`, 120 ms) zur Position — das repliziert das smoothe Chart.js-Tooltip-Gefühl des Originals ohne Canvas-Redraws
- Aktuelle Stunde als dezenter Punkt-Marker vorbelegt
- Fallback-Plan falls das Gefühl nicht stimmt: uPlot (~40 KB) — erst nach Review entscheiden, nicht präventiv einbauen

---

## 9. Tray / Menubar

- **Default: Template-Image** (monochrom, macOS invertiert automatisch) — `IconTemplate`-Konvention wie im Original; temps-Logo (Hexagon-Wolke des Originals modernisiert) als schlichte Silhouette
- **Setting „Temperatur in Menubar":** Titel-Text neben Icon, z. B. `12°` (Original-Feature)
- **Setting „Farbindikator" (opt-in, default aus):** beacons `create_tray_icon`-Kompositions-Code in Rust umwidmen — kleiner Punkt rechts unten am Icon in der aktuellen Temperaturfarbe (RGB aus Frontend via Command an Rust). Kein vollfarbiges Multi-Color-Icon in der Menubar (bricht macOS-Konvention)
- Klick toggelt Popover an Tray-Position (`tray.rs` aus beacon: `position_window_at_tray`, `toggle_main_window` — weitgehend 1:1), Rechtsklick: Kontextmenü (Refresh, Settings, Quit)
- Fokusverlust schließt das Popover (blur-Handler)

---

## 10. Feature-Spezifikation

### 10.1 Favoriten-Städte (`favorites.svelte.ts`)

- Bis zu 5 Städte, gespeichert via `plugin-store` (`storage.ts`-Pattern aus beacon): `{ name, country, lat, lon, timezone }`
- Stern-Icon in der Stadtsuche (Original hatte den Stern rudimentär), Verwaltung in Settings (Reihenfolge per Drag, Entfernen)
- **Cmd+1…5** springt direkt zur Stadt, **Cmd+F** öffnet Suche, **Cmd+G** eigener Standort, **Cmd+W** Random-City (Städteliste aus alter `config.json` übernehmen — Easter-Egg-Charakter erhalten)
- Wetter-Cache pro Favorit (Map im Weather-Store) → Stadtwechsel fühlt sich instant an, Refresh im Hintergrund

### 10.2 UV-Index & Gefühlte Temperatur

Bereits im Haupt-Request enthalten (`uv_index`, `apparent_temperature`). Details-Screen-Kacheln; UV mit Textstufe (niedrig/mäßig/hoch/sehr hoch ab 3/6/8). Gefühlt zusätzlich als kleiner Zusatz unter der großen Temperatur auf dem Overview, wenn |gefühlt − real| ≥ 3°.

### 10.3 Mondphase (`services/moon-phase.ts`)

Open-Meteo liefert keine Mondphase → lokale Berechnung:

```ts
const SYNODIC = 29.53058867;
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14); // Referenz-Neumond
export function moonPhase(date = new Date()): number {
  const days = (date.getTime() - KNOWN_NEW_MOON) / 86_400_000;
  return ((days % SYNODIC) + SYNODIC) % SYNODIC / SYNODIC; // 0..1
}
```

Mapping auf die 8 vorhandenen Icons: `moon-newmoon` (±0.0625 um 0/1), `moon-waxing-crescent`, `moon-first-quarter`, `moon-waxing-gibbous`, `moon-fullmoon`, `moon-waning-gibbous`, `moon-last-quarter`, `moon-waning-crescent`. Unit-Tests gegen 3–4 bekannte Vollmond-Daten (Toleranz ±1 Tag).

### 10.4 Update-Check & Autostart

- `update-check.ts` aus beacon adaptieren: GitHub Releases API (`repos/konradmichalik/temps/releases/latest`), Vergleich via semver-Light (kein Package), dezenter Hinweis in Settings + Toast einmal pro neuer Version
- Autostart via `tauri-plugin-autostart`, Setting „Start at login" (Original-Feature)

### 10.5 Regen-Notification (`services/rain-alert.ts`)

- Quelle: `minutely_15.precipitation` (nächste 2 h) für den **aktiven Standort**
- Logik im Polling-Zyklus: aktuell trocken (`precipitation ≈ 0`) UND ein 15-min-Slot ≤ 120 min mit `precipitation > 0.1` → Notification „Regen beginnt in ~{n} min in {Stadt}" via `plugin-notification`
- Entprellung: max. 1 Notification pro Regen-Ereignis (Flag bis wieder ≥ 60 min trocken), Setting opt-in (default aus), Ruhe nachts (23–7 Uhr lokale Zeit)

### 10.6 Luftqualität & Pollen (v1.1 — vorbereiten, nicht in v1.0 bauen)

- `air-quality.ts`-Service (Endpoint s. o.), lazy beim ersten Öffnen des Details-Screens, eigener 60-min-Cache
- Kacheln: Europäischer AQI mit Textstufe + Farb-Dot, Pollen-Zeile mit den relevanten aktiven Arten (nur Werte > 0 zeigen), `pollen`-Icon aus weather-iconic
- Feature-Flag im Settings-Store, damit v1.0 den Code-Pfad schon kennt, aber UI ausblendet

### Bewusste Nicht-Ziele (v1)

Unwetterwarnungen (keine Open-Meteo-Warn-API → zweiter Anbieter = Scope-Creep), historische Daten, Widgets, Windows/Linux-Builds (Tauri hält es offen, NSPanel-/Tray-Code ist der einzige macOS-Hard-Lock), mehrere gleichzeitige Fenster.

---

## 11. Settings & Shortcuts

**Settings (SettingsView, eigener Screen wie beacon, erreichbar via Zahnrad/Cmd+S):**
Einheit °C/°F · Zeitformat 24 h/12 h · Sprache DE/EN (UI + `wmoToLabel`) · Polling-Intervall (5/15/30/60 min) · Menubar: Temp-Text an/aus, Farbindikator an/aus · Effekte an/aus · Regen-Notification an/aus · Autostart · Favoriten-Verwaltung · Globaler Shortcut (default Cmd+Shift+W) · About mit Open-Meteo- und weather-iconic-Credits + Versions-/Update-Info

**Shortcuts (Original-Belegung erhalten):**
`Cmd+Shift+W` global toggle · `Cmd+D` Screen-Zyklus · `Cmd+S` Settings · `Cmd+F` Suche · `Cmd+G` eigener Standort · `Cmd+W` Random City · `Cmd+R` Reload · `Cmd+E` Daten-Refresh · `Cmd+1…5` Favoriten · `Cmd+Q` Quit · `Esc` schließt Popover/Suche

---

## 12. Landingpage mit Live-Demo

- Build wie beacon: `vite.landing.config.ts`, Deploy auf GitHub Pages (`konradmichalik.github.io/temps`)
- **Hero = die echte App:** dieselben Svelte-Komponenten als Web-Build (dank fetch-Abstraktion aus Abschnitt 2), gerahmt als Popover-Mock mit Tray-Pfeil. Initialisierung: `navigator.geolocation` (Permission-Prompt erst nach Klick auf „Use my location"), Fallback Berlin. Voll interaktiv: Carousel, Suche, Effekte, Live-Daten
- Seitenhintergrund übernimmt die aktuelle Temperaturfarbe der Demo (mit Transition) — die Page demonstriert das Farbkonzept selbst
- Sektionen: Hero · Feature-Strip (3 Screens erklärt, live statt Screenshot) · Install (`brew install konradmichalik/tap/temps`, Version-/Download-Badges via shields.io-Endpoint wie bei beacon) · Shortcuts-Übersicht · Credits (weather-iconic-Link, „Weather data by Open-Meteo.com" CC BY 4.0, „the original temps (2016)"-Verweis auf temps-legacy)
- Demo-Mode-Schalter (`?demo=sunny|rain|snow|thunder|night`) mit deterministischen Daten (Pattern: beacons `demo-data.ts`) — für Screenshots und um alle Effekte zeigen zu können

---

## 13. Release & CI

- GitHub Actions: `lint` (eslint + prettier) · `check` (svelte-check) · `test` (vitest) · `tauri build` (macOS arm64 + x64 universal) auf Tag
- Homebrew: Cask in `konradmichalik/homebrew-tap`, Badge-JSONs (Version/Downloads) via bestehende Cron-Pipeline erweitern
- Landing-Deploy: Pages-Workflow auf `main`
- App nicht notarisiert? → Für Homebrew-Distribution: ad-hoc signieren + `xattr`-Hinweis, oder Developer-ID falls vorhanden (wie beacon gehandhabt)

## 14. Meilensteine

| Phase | Inhalt | Ergebnis |
|---|---|---|
| **0 — Migration** | Abschnitt 0: Key-Revoke, Rename, Archivierung, neues Repo | Namensraum sauber |
| **1 — Fundament** | Scaffold aus beacon, Tray/NSPanel, Fenster, `open-meteo.ts` + Stores, Farbsystem, Rubik | Popover zeigt echtes Wetter mit Temperaturfarbe |
| **2 — Look** | WeatherIcon + Multi-Color-Sichtprüfung, Overview-Screen, Wellen, Typo-Feinschliff gegen Screenshot | Screen 1 ≈ Original |
| **3 — Carousel & Chart** | Scroll-Snap-Carousel, Hourly-Chart mit Tooltip, Details-Grid, Effekt-Layer | Alle 3 Screens + Effekte |
| **4 — Features** | Favoriten, Suche, Shortcuts, Settings, Mondphase, UV/Gefühlt, Tray-Optionen, Regen-Alert, Autostart, Update-Check | Feature-complete v1.0 |
| **5 — Ship** | Landingpage + Live-Demo, CI, Homebrew, README (Screenshots via Demo-Mode), Credits | Release v1.0.0 |
| **6 — v1.1** | Air Quality + Pollen aktivieren | v1.1.0 |

## 15. Qualitätskriterien / Definition of Done

- Optischer Abgleich gegen `screenshot-overview.png`: Farbflächen, Typo-Hierarchie, Icon-Sprache, Wellen — erkennbar „temps", nur feiner
- 60 fps beim Swipen mit aktivem Regen-Effekt (Effekte nur `transform`/`opacity` animieren)
- `prefers-reduced-motion` respektiert (Effekte + Chart-Animation aus)
- Kein API-Key, kein Secret im Repo; Attribution vorhanden
- Unit-Tests: `wmoToIcon` (alle Codes), `tempToColor` (beide Einheiten, Grenzwerte), `moonPhase`, Rain-Alert-Logik
- App-Bundle < 15 MB, Kaltstart < 1 s
