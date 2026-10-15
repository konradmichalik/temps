# Screen designs

The reference designs for the temps tiles, screens and landing page. They live on a design canvas: https://claude.ai/artifact/Q1uvm7SB8HB5Mvua3qUp4y. The canvas is private to its owner until it is shared from its Share menu.

Board titles are German. The app screens use German copy because the demo locale is German; the app ships both locales (see [rules.md](rules.md#copy)). The landing page uses English copy. Values in the mockups (temperatures, places, times) are examples.

The rules behind these screens are in [rules.md](rules.md). The previews are exports of the canvas in their resting state, taken with reduced motion; click one for the full size. When a board changes on the canvas, export it again and replace its file in `screens/`.

## App

| Board | Screen | What it settles | Preview |
| --- | --- | --- | --- |
| 1 | Details, warm, day | 3-column tile grid, tile anatomy, scale with dot, fill bar, pollen pips, compass and moon glyphs, 2×1 sun tile with the day wave | <a href="screens/01-details-day.png"><img src="screens/01-details-day.png" width="160" alt="Board 1"></a> |
| 2 | Details, cold, night | The same grid on a cold night accent, contrast-safe `accent-deep`, moon marker, twinkling stars in the sky | <a href="screens/02-details-night.png"><img src="screens/02-details-night.png" width="160" alt="Board 2"></a> |
| 3 | Overview | Forecast days as tile buttons with high, low and a rain bar; the board is interactive on the canvas | <a href="screens/03-overview.png"><img src="screens/03-overview.png" width="160" alt="Board 3"></a> |
| 4 | Day sheet | The sheet after tapping a day: hourly temperature line, rain bars, three mini stat tiles, close button | <a href="screens/04-day-sheet.png"><img src="screens/04-day-sheet.png" width="160" alt="Board 4"></a> |
| 5 | Overview, rain | Rain effect in the sky, nowcast strip under the condition, forecast with lightning, wind, snow and rainbow icons | <a href="screens/05-overview-rain.png"><img src="screens/05-overview-rain.png" width="160" alt="Board 5"></a> |
| 6 | Standalone, phone | 2-column grid, larger type, 2×1 tiles for the hourly rain and the sun wave, context lines in full | <a href="screens/06-phone.png"><img src="screens/06-phone.png" width="160" alt="Board 6"></a> |

## System

| Board | Screen | What it settles | Preview |
| --- | --- | --- | --- |
| 7 | Tile system | Anatomy, visualisation primitives, tokens, tap states, rules, motion | <a href="screens/07-tile-system.png"><img src="screens/07-tile-system.png" width="240" alt="Board 7"></a> |
| 8 | Icon library | All 33 weather-iconic icons in use, primary and secondary roles, one icon in four contexts | <a href="screens/08-icons.png"><img src="screens/08-icons.png" width="240" alt="Board 8"></a> |
| 9 | Landing page | Hero with live demo and sky switcher, icon band, feature tiles, nine-colour palette, shortcuts, download | <a href="screens/09-landing.png"><img src="screens/09-landing.png" width="160" alt="Board 9"></a> |

The canvas also holds `Icon.dc.html`, the icon component the boards share. It is a design tool, not a screen.
