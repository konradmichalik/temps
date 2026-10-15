# Design rules

These rules are binding for every change to the temps UI: the popover, the standalone web app and the landing page. When a change needs to break one, change the rule here first, in the same pull request, and say why.

The screens these rules produce are listed in [screens.md](screens.md). Tokens live in `src/app.css`, the temperature palette in `src/lib/utils/temp-color.ts`.

## Principles

1. **The temperature is the colour.** One accent per moment, picked from the nine-colour palette. Everything else on the paper is ink and greys.
2. **One tile, four rows.** Every metric uses the same anatomy, in the popover, on the phone and on the landing page.
3. **Colour never speaks alone.** Every scale has a word (high, okay, medium), every bar has a value next to it.
4. **Icons stay whole.** A weather-iconic icon moves as one piece or not at all. Its parts only change opacity. Icons that show data stay still.
5. **Calm by default, playful on purpose.** Motion is added inside `prefers-reduced-motion: no-preference` and only where it tells something about the weather.

## Colour

### Paper and ink

| Token | Value | Use |
| --- | --- | --- |
| `--paper` | `#ffffff` | Paper zone below the colour band |
| `--tile` | `#f5f4f1` | Tile surface |
| `--tile-hover` | `#edebe6` | Hover and pressed tile |
| `--ink` | `#1f2630` | Values, headings, temperature line in charts |
| `--ink-muted` | `#59606b` | Labels, units, context lines, icon base colour |
| `--track` | accent at 30 % alpha (`accent + '4D'`) | Empty part of a scale, inactive pips |
| `--ink-strong`, `--ink-soft`, `--ink-faint` | existing | Text and icons on the colour band |

- Measured contrast: `--ink` on `--tile` 13.9:1, `--ink-muted` on `--tile` 5.8:1, `--ink-muted` on `--paper` 6.3:1.
- Tiles have no border and no shadow. Depth comes from the surface only.
- `--paper-ink` and `--paper-ink-strong` remain as aliases of `--ink-muted` and `--ink` until the settings view and the hourly chart use the new names. New code uses `--ink` and `--ink-muted`.

### Accent

The accent is `tempToColor()` and its thresholds never change (design DNA, see `temp-color.ts`).

`accent-deep` is the accent used for marks on the tile: icon highlights, filled bars, scale dots, the sun marker. It is the accent darkened until it reaches **3.3:1 against `--tile`** (WCAG 1.4.11 needs 3:1). Today it is `darken(accent, 0.18)` (`AppCard.svelte:125`), which fails for six of the nine colours.

| Accent | Temperature (°C) | `accent-deep` | On `--tile` | `darken(…, 0.18)` today |
| --- | --- | --- | --- | --- |
| `#b1695a` | above 30 | `#955446` | 5.25:1 | 5.25:1 |
| `#DB9864` | 27 to 30 | `#c5702e` | 3.33:1 | 2.95:1 |
| `#E3BB88` | 23 to 26 | `#b6792b` | 3.32:1 | 2.16:1 |
| `#D0C7A8` | 19 to 22 | `#92834f` | 3.42:1 | 2.09:1 |
| `#B1C2A3` | 15 to 18 | `#738e5e` | 3.31:1 | 2.36:1 |
| `#80BBB2` | 11 to 14 | `#4d9085` | 3.38:1 | 2.56:1 |
| `#6D9E96` | 7 to 10 | `#57847c` | 3.82:1 | 3.82:1 |
| `#8F95A5` | 3 to 6 | `#71788c` | 4.00:1 | 4.00:1 |
| `#6F7685` | 2 and below | `#5b616d` | 5.66:1 | 5.66:1 |

- The algorithm: start at `darken(accent, 0.18)`, add 0.02 until the contrast holds. The table is its output and doubles as the unit test.
- **The accent is never a text colour on paper.** The light palette colours stay below 4.5:1 even after darkening.
- No traffic-light colours for UV or air quality. One colour world per temperature, as in the hero. The band word carries the meaning.

## Icons

All weather glyphs are [weather-iconic](https://github.com/konradmichalik/weather-iconic) in its multi-colour form. No emoji, no other icon set. Inline stroke SVG is allowed only for a glyph the set does not have (the trend arrow, the close cross).

Each icon has one or two top-level groups. The first of two is the **highlight** (drops, rays, mercury, needle, lightning), the second or only one is the **base** (cloud, body, ring). `WeatherIcon.svelte` already colours them this way.

| Context | Highlight (`primary`) | Base (`secondary`) |
| --- | --- | --- |
| Colour band (hero, header) | `#ffffff` | `rgba(255, 255, 255, 0.5)` |
| Colour band at night, moon and stars | `#f3d9a4` | `rgba(255, 255, 255, 0.5)`; the single-part `moon` gets `#f3d9a4` here too |
| Tile, forecast tile, sheet | `accent-deep` | `--ink-muted` |
| Single-group icons on a tile (`sun`, `moon`) | `accent-deep` | `accent-deep` |

| Use | Size popover | Size phone |
| --- | --- | --- |
| Tile eyebrow | 18px | 22px |
| Glyph in the value row (compass, moon phase) | 32px with −7px margin | 48px with −10px margin |
| Forecast tile | 32px | 32px |
| Details hero | 46px | 64px |
| Overview hero | 62px | 62px |

### Icon per metric

| Tile | Eyebrow icon | Value-row glyph |
| --- | --- | --- |
| Wind | `wind` | `compass-<direction>` from `windDirectionIcon()` |
| Feels like | `thermometer-hot` when warmer than the air, `thermometer-cold` when colder, else `thermometer-medium` | none |
| Humidity | `humidity` | none |
| Pressure | `barometer` | none |
| Rain chance (1×1) | `umbrella` | none |
| Rain per hour (2×1) | `cloud-rain` | none |
| UV index | `sun` | none |
| Air quality | `cloud-smog` | none |
| Pollen | `pollen` | none |
| Moon | `stars` | `moonPhaseIcon()` |
| Sun (2×1) | `sunrise`, `sunset` next to the times | `sun` by day, `moon` by night as the wave marker |

## Typography

Rubik only, self-hosted through `@fontsource/rubik`. No second family.

| Role | Popover | Phone | Weight |
| --- | --- | --- | --- |
| Hero temperature, Overview | 96px | 96px | 300 |
| Hero temperature, Details | 52px | 72px | 300 |
| Tile value | 18px | 28px | 500 |
| Pollen species as value | 16px | 24px | 500 |
| Forecast high | 17px | 17px | 500 |
| Unit and band word | 10px | 13px | 400, `--ink-muted` |
| Context line | 10px | 12px | 400, `--ink-muted` |
| Eyebrow label | 9px | 11px | 500, uppercase, `letter-spacing: 0.07em` |

- Popover and phone values switch at `@container card (min-width: 380px)`, where the grid also changes from three to two columns. One component serves both.
- **9px is the floor, and only for uppercase eyebrows.** Everything else is 10px or more.
- Values use tabular digits. A unit or band word sits on the value's baseline, never on its own line.
- Only eyebrows are uppercase; everything else is sentence case.

## Tile anatomy

Every tile has the same four rows, distributed with `justify-content: space-between`:

1. **Eyebrow:** icon plus label.
2. **Value:** the number with its unit or band word as a quiet suffix. An optional glyph sits on the right of this row, only when the value leaves room.
3. **Glyph:** see the icon table; never more than one per tile.
4. **Footer:** either a context line that interprets the value (`Dew point 20°`, `colder because of wind`) or one visualisation primitive. Never a line that repeats the value.

### Visualisation primitives

Three primitives only. A new tile uses one of them or changes this list first.

| Primitive | Shape | Used by |
| --- | --- | --- |
| Scale with dot | 4px `--track` bar, 10px dot (12px on phone) with white fill and a 2.5px `accent-deep` ring | UV index (0 to 11), air quality (0 to 100) |
| Fill and steps | 4px bar filled with `accent-deep`, or three pips | Rain chance, pollen level |
| Icon glyph | weather-iconic icon in the value row | Wind direction, moon phase |

Time series (rain per hour, the sun wave) appear only in 2×1 tiles.

Rain bars, in every chart: a dry hour (0 %) draws nothing, and any chance above 0 stays at least 2px tall (`rainBarHeight()` in `metrics.ts`). A sliver under a pixel reads as a baseline, not as rain.

### Tiles and their data

| Tile | Value | Footer | Data source |
| --- | --- | --- | --- |
| Wind | `14 km/h` | `from SW · gusts 28` | `wind_speed_10m`, `wind_direction_10m`; **new** `wind_gusts_10m` |
| Feels like | `30°` | `2° warmer` / `colder because of wind` | `apparent_temperature` |
| Humidity | `62 %` | `Dew point 20°` | `relative_humidity_2m`; **new** `dew_point_2m` |
| Pressure | `1016 hPa` | trend arrow plus `rising`, `falling` or `steady` | **new** `pressure_msl`, current and hourly. Replaces `surface_pressure`, which reads 1013 hPa in Dresden when the sea-level value is 1028 |
| Rain chance (popover, 1×1) | `20 %` | fill bar | `precipitation_probability_max` (today) |
| Rain per hour (phone, 2×1, replaces the 1×1) | twelve hourly bars | header: `from 15:00`, the first hour at 50 % or more, else `Dry` | hourly `precipitation_probability` |
| UV index | `6 high` | scale with dot; phone adds `Peak at 13:00` | `uv_index`; peak from **new** hourly `uv_index` |
| Air quality | `32 okay` | scale with dot; phone adds the leading pollutant | `european_aqi`, `aqiLabel()`; **new** `european_aqi_pm2_5`, `_pm10`, `_nitrogen_dioxide`, `_ozone`, `_sulphur_dioxide` |
| Pollen | strongest species | `Also <second species>`; three pips once levels exist | pollen values from `air-quality.ts`; levels are an open question |
| Moon | `63 %` illuminated | `Full moon in 4 d` within a week, else `Waxing` or `Waning` | `moonPhase()`; illumination is `(1 − cos 2πp) / 2` |
| Sun (2×1) | sunrise and sunset times | the day wave from `SunArc.svelte` | `sunrise`, `sunset` |

All new fields were checked against the live API on 2026-10-14; both endpoints answer with the names above.

- Pressure trend: the difference to the value three hours earlier. Less than 1 hPa reads `steady`.
- Tiles without data are left out, as `airTiles` does today. The grid never shows an empty tile.

## Layout

| Element | Popover (340×480) | Phone (standalone) |
| --- | --- | --- |
| Grid | 3 columns, 6px gap | 2 columns, 8px gap |
| Paper padding | 6px 12px 22px | 12px 16px 24px |
| Tile height | 80px | 108px |
| Tile padding | 7px 9px 8px | 11px 14px 12px |
| Tile radius | 12px | 16px |
| 2×1 sun tile height | 64px | 96px |
| Details colour band | 144px (30 %). Today 34 % (`DetailsScreen.svelte:149`), which leaves no room for the sun tile | 200px |
| Overview colour band | 64 %, the shared hero (`AppCard.svelte`) | unchanged |
| Forecast tile | 116px high, 4 columns, 6px gap | unchanged |
| Day sheet | starts at 56 %, 16px top radius, mini stat tiles 52px high | unchanged |

### Forecast and day sheet

- A forecast day is a real `<button>` with `aria-haspopup="dialog"` and a name that holds day, condition, high, low and rain chance.
- The day that the open sheet shows carries an inset 2px `accent-deep` ring.
- The sheet chart covers the whole local day and draws the temperature as a 2px `--ink` line and the rain chance as `accent-deep` bars at 55 % opacity. Rain never uses the track colour, which falls below 3:1.

### Tap states

Only tappable tiles (the forecast days) have these states. A detail tile shows information only and does not react to hover, so it never promises an action.

| State | Look |
| --- | --- |
| Rest | `--tile` |
| Hover | `--tile-hover`, lifts 2px |
| Focus | 2px `--ink` outline, 2px offset |
| Pressed | `--tile-hover`, scale 0.97 |
| Selected | inset 2px `accent-deep` ring |

## Motion

Motion is added only inside `prefers-reduced-motion: no-preference`. The static state is the final state. Easing is `cubic-bezier(0.22, 1, 0.36, 1)`, no bounce and no spring.

| Where | What | Duration |
| --- | --- | --- |
| Tiles and hero | The shared `.st` entrance: fade and 10px rise, staggered | 420ms, +60ms per tile |
| Fill bars | Grow from the left after their tile | 900ms |
| Scale dot | Slides in from the left end of the scale | 1100ms |
| Rain bars | Grow from the bottom, staggered | 700ms, +45ms per bar |
| Hero icon | Floats 10px | 6s loop |
| Wave | The existing `Waves` layers drift and morph at the paper edge | as today |
| Sun marker | The icon stays still, it shows a position; a ring around it pulses in opacity | 2.4s loop |
| Night sky | Three weather-iconic `stars` twinkle in opacity, on nights without precipitation | 3s loop |
| Forecast day hover | Lifts 2px; pressed scales to 0.97 | 200ms |
| Day sheet | Slides up | 300ms |

The day sheet slide is JavaScript-driven and plays under reduced motion as well (`OverviewScreen.svelte:42`). It is the one exception, because it shows where the sheet comes from.

### Icon motion

| Icons | Motion of the whole icon | Opacity of a part |
| --- | --- | --- |
| `sun`, `snowflake` | Spins, 22s, around the centre (16/16, measured) | none |
| `moon` | Sways ±5°, 9s | none |
| `umbrella`, `windsock` | Sway ±5° around the drawn foot (50 % 74 %, 27 % 79 %) | none |
| Cloud icons, `wind`, `rainbow` | Drift ±4 % sideways, 6s | Drops, lines and snow 1 to 0.4; lightning flashes to 0.35 |
| `stars`, `shooting-star`, `pollen`, `raindrop`, `humidity` | Bob up and down, 3s | Highlight glows 1 to 0.55 |
| `sun-high`, `sun-cloud`, `moon-cloud`, `sunrise`, `sunset`, thermometers | none | Highlight glows 1 to 0.55, 3.2s |
| `compass-*`, `barometer`, moon phases | **none**, they show data | none |
| The sun marker and the stars in the sky | **none** | stars twinkle as a whole (effects layer) |

- **A part never gets a `transform`.** The parts are drawn to touch; moving one against the other breaks the drawing. Moving the parts separately shifted them by up to 3.8 of 32 units.
- A part never fades below 35 %.
- `weather-sprite.ts` wraps each top-level group in `<g class="hl">` or `<g class="base">`, and the motion targets those wrappers. The original groups keep their `transform` attribute, which a CSS transform would replace.
- The existing switches decide: `effectsEnabled` turns off the sky effects and the icon motion, `waveAnimation` turns off the wave.

## Accessibility

WCAG 2.2 AA.

| Criterion | Rule |
| --- | --- |
| 1.4.1 Use of colour | Every scale has a band word, every bar a value |
| 1.4.3 Text contrast | 4.5:1 for text on paper and tiles. On the landing page the background darkens until the text reaches 4.5:1 |
| 1.4.11 Non-text contrast | `accent-deep` at 3.3:1 for every mark on a tile |
| 2.4.7 Focus | Visible 2px outline on every tile button and control |
| 2.5.8 Target size | 24px minimum; 44px for controls on the phone and the landing page |
| 4.1.2 Name, role | Forecast days are buttons, the sheet is a dialog with a name, icon-only buttons have an `aria-label`, visualisations have `role="img"` with a text alternative |

## Copy

- The app ships English and German. Labels go through the existing `de ?` pattern, one pair per label.
- Tile labels: Wind, Feels like / Gefühlt, Humidity / Luftfeuchte, Pressure / Luftdruck, Rain / Regen, UV index / UV-Index, Air quality / Luftqualität, Pollen, Moon / Mond, Sun / Sonne. The popover shows the short labels Feuchte and Air / Luft; the full label stays for screen readers.
- Band words for air quality come from `aqiLabel()`. UV bands follow the WHO: low 0 to 2, moderate 3 to 5, high 6 to 7, very high 8 to 10, extreme 11 and above.

## Landing page

- Built from `src/landing/` with the existing Vite config, as today. The hero demo stays the real `AppCard`, driven by `weather.setDemo()`.
- The page background follows the demo's temperature colour, as today. Text takes `--ink` or white, whichever contrasts more; when neither reaches 4.5:1, the background is darkened in 0.02 steps until it does. Measured over all nine colours by day and night, the weakest case is 4.56:1.
- The sky switcher keeps the existing scenarios (Sunny, Rain, Snow, Thunder, Night, Live) as pill buttons with a weather-iconic icon and `aria-pressed`.
- Features are tiles with an animated weather-iconic icon, no emoji.
- The palette strip shows the nine colours with their temperature range below the swatch, in page ink. A swatch sets the page colour only; the demo keeps the colour of its own data.
- The icon band scrolls slowly and pauses on hover. Under reduced motion it wraps into a static grid.
- Rubik is self-hosted, no Google Fonts and no other third-party request. The canvas loads Rubik from Google Fonts for the mockup only.
- No horizontal scrolling down to 320px. Navigation links and buttons are at least 44px high.
- Copy claims only what README and docs state. Credits for Open-Meteo (CC BY 4.0) and weather-iconic stay in the footer.

## Implementation basis

The order the implementation follows. Each step lands with its tests and a browser check.

1. **Tokens:** add the paper, tile, ink and radius tokens to `src/app.css`.
2. **Accent:** a contrast-safe `accentDeep()` in `utils/temp-color.ts`, tested against the accent table above, used by `AppCard.svelte`.
3. **Icons:** `weather-sprite.ts` wraps the top-level groups in `hl` and `base`; `WeatherIcon.svelte` adds `wi-<name>`. Tests check one- and two-group icons.
4. **Data:** `open-meteo.ts` requests `dew_point_2m`, `wind_gusts_10m`, `pressure_msl` (current and hourly) and hourly `uv_index`; `air-quality.ts` requests the five sub-indices. Pure helpers for the pressure trend, the UV peak and the leading pollutant, with tests.
5. **Tiles:** one tile component with the four rows, plus the scale and the pips. `DetailsScreen.svelte` moves to the grid and the 30 % band.
6. **Forecast and sheet:** `OverviewScreen.svelte` gets the forecast tiles, the selected ring and the mini stat tiles.
7. **Motion:** one motion stylesheet with the tables above, gated by the media query and the existing switches.
8. **Landing page:** `Landing.svelte` after the landing rules.

## Open questions

- **Pollen levels.** Open-Meteo returns grains per m³. Thresholds for none, low, medium and high need a source (for example the DWD categories) before the pips can show them. Until then the tile shows the species only.
- **White text on the hero.** White on the lighter palette colours reaches only 1.7 to 2.4:1. It is design DNA and not part of this concept, but it fails 1.4.3.
- **Landing demo language.** The demo follows the browser locale, so a German visitor sees German screens on the English page.

## Pull request checklist

- [ ] Colours come from tokens or `accentDeep()`, no literals
- [ ] Every tile follows the four rows and uses one of the three primitives
- [ ] Every scale has a band word
- [ ] Icons are weather-iconic; no `transform` on `.hl` or `.base`; data glyphs stay still
- [ ] Popover, phone, night accent and reduced motion checked in the browser, screenshot in the PR
- [ ] A rule that changed is updated in this file, and the board on the canvas and its export in `screens/` match
