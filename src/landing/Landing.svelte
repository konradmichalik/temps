<script lang="ts">
  /**
   * Landing page. The hero is the *real* app (same AppCard component, browser
   * fetch path) framed as a menubar popover, so the demo is always live. The
   * page background follows the demo's temperature color — the page shows off
   * the color concept by being it. docs/design/rules.md#landing-page
   */
  import { onMount } from 'svelte';
  import AppCard from '../lib/components/layout/AppCard.svelte';
  import WeatherIcon from '../lib/components/ui/WeatherIcon.svelte';
  import { weather } from '../lib/stores/weather.svelte';
  import { settings } from '../lib/stores/settings.svelte';
  import { APP_VERSION } from '../lib/version';
  import type { DemoScenario } from '../lib/utils/demo-data';
  import {
    TEMP_COLORS,
    accentDeep,
    inkOn,
    textSafe,
    tempToColor,
  } from '../lib/utils/temp-color';

  const VERSION = APP_VERSION;
  const REPO = 'https://github.com/konradmichalik/temps';

  const SCENARIOS: { id: DemoScenario; label: string; icon: string }[] = [
    { id: 'sunny', label: 'Sunny', icon: 'sun' },
    { id: 'rain', label: 'Rain', icon: 'cloud-rain' },
    { id: 'snow', label: 'Snow', icon: 'cloud-snow' },
    { id: 'thunder', label: 'Thunder', icon: 'lightning' },
    { id: 'night', label: 'Night', icon: 'moon' },
  ];

  const FEATURES = [
    {
      icon: 'thermometer-hot',
      title: 'Colored by the weather',
      body: 'A full-bleed background that shifts across a nine-color palette as the temperature changes — you feel the forecast before you read it.',
    },
    {
      icon: 'sun-cloud-rain',
      title: 'Hand-rolled hourly chart',
      body: 'The next 24 hours as one smooth SVG line — no chart library — with a tooltip that glides along as you point.',
    },
    {
      icon: 'sun-cloud',
      title: 'Tap any day',
      body: 'The four-day forecast stays compact; tap a day and a sheet slides up with its hourly curve, high, low and chance of rain.',
    },
    {
      icon: 'sunrise',
      title: 'Sun & moon, all day',
      body: 'A full-width day/night wave shows exactly where the sun sits right now — and the moon takes over after dark.',
    },
    {
      icon: 'pollen',
      title: 'Air quality & pollen',
      body: 'European AQI and pollen next to wind, feels-like, humidity, pressure, UV and the moon phase.',
    },
    {
      icon: 'umbrella',
      title: 'Private by design',
      body: 'No API keys, no accounts, no tracking — just Open-Meteo, and an update check against GitHub releases.',
    },
  ];

  const SHORTCUTS = [
    { keys: '⌘⇧W', label: 'Show / hide (global)' },
    { keys: '⌘D', label: 'Cycle screens' },
    { keys: '⌘F', label: 'Search a city' },
    { keys: '⌘G', label: 'My location' },
    { keys: '⌘W', label: 'Random city' },
    { keys: '⌘E', label: 'Refresh data' },
    { keys: '⌘1…5', label: 'Jump to favorite' },
    { keys: '⌘S', label: 'Settings' },
  ];

  const ICON_BAND = [
    'sun',
    'sun-high',
    'sun-cloud',
    'sun-cloud-rain',
    'sun-cloud-lightning',
    'cloud',
    'clouds',
    'cloud-rain',
    'cloud-snow',
    'cloud-wind',
    'moon',
    'moon-cloud',
    'stars',
    'wind',
    'thermometer-hot',
    'thermometer-cold',
    'humidity',
    'umbrella',
    'cloud-smog',
    'pollen',
    'sunrise',
    'sunset',
    'raindrop',
    'rainbow',
    'shooting-star',
    'snowflake',
    'lightning',
    'windsock',
  ];

  // One representative temperature per palette color (above its threshold).
  const PALETTE = TEMP_COLORS.map((hex, i) => ({
    hex,
    range: [
      'above 30°',
      '27 to 30°',
      '23 to 26°',
      '19 to 22°',
      '15 to 18°',
      '11 to 14°',
      '7 to 10°',
      '3 to 6°',
      '2° and below',
    ][i],
    icon: [
      'thermometer-hot',
      'thermometer-hot',
      'sun-high',
      'sun-cloud',
      'cloud',
      'cloud-rain',
      'cloud-wind',
      'thermometer-cold',
      'snowflake',
    ][i],
  }));

  let copied = $state(false);
  /** A palette swatch overrides the page color until the sky changes. */
  let pageColor = $state<string | null>(null);
  const brew = 'brew install konradmichalik/tap/temps';

  const bg = $derived(textSafe(pageColor ?? weather.bgColor));
  const ink = $derived(inkOn(bg));
  const dark = $derived(ink !== '#ffffff');
  const markOnTile = $derived(
    accentDeep(
      pageColor ??
        (weather.data
          ? tempToColor(weather.data.current.temperature, settings.unit)
          : TEMP_COLORS[5]),
    ),
  );

  onMount(() => {
    const param = new URLSearchParams(location.search).get('demo');
    if (param && SCENARIOS.some((s) => s.id === param)) {
      weather.setDemo(param as DemoScenario);
    } else {
      weather.load();
    }
  });

  function pickSky(id: DemoScenario | null) {
    pageColor = null;
    if (id) weather.setDemo(id);
    else weather.load();
  }

  async function copyBrew() {
    try {
      await navigator.clipboard.writeText(brew);
      copied = true;
      setTimeout(() => (copied = false), 1600);
    } catch {
      /* clipboard blocked — the command is visible anyway */
    }
  }
</script>

<div
  class="page"
  class:dark
  class:motion={settings.effectsEnabled}
  style:background-color={bg}
  style:color={ink}
  style:--mark={markOnTile}
>
  <header class="topbar">
    <span class="wordmark">
      <WeatherIcon
        name={weather.data
          ? (SCENARIOS.find((s) => s.id === weather.demo)?.icon ?? 'sun-cloud')
          : 'sun-cloud'}
        size={30}
        primary={ink}
        secondary={dark ? 'rgba(31,38,48,0.45)' : 'rgba(255,255,255,0.55)'}
        label=""
      />temps
    </span>
    <nav aria-label="Main">
      <a href={REPO} target="_blank" rel="noreferrer">GitHub</a>
      <a href="{REPO}/releases" target="_blank" rel="noreferrer">Download</a>
    </nav>
  </header>

  <main>
    <section class="hero">
      <div class="pitch">
        <span class="version">v{VERSION}</span>
        <h1>A simple but smart<br />menubar weather app.</h1>
        <p class="lede">
          The 2016 original, rebuilt: Tauri&nbsp;2 and Svelte&nbsp;5 instead of
          Electron, Open-Meteo instead of API keys, multi-color weather-iconic
          icons. Lives in your menu bar, colored by the temperature.
        </p>
        <div class="install">
          <code>{brew}</code>
          <button
            type="button"
            onclick={copyBrew}
            aria-label="Copy install command"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <p class="platform">
          macOS 13+ · Apple Silicon &amp; Intel · MIT licensed · No Mac?
          <a href="app/">Open the web app</a>
        </p>
        <div class="sky">
          <span class="eyebrow" id="sky-label">Try a sky</span>
          <div class="scenarios" role="group" aria-labelledby="sky-label">
            {#each SCENARIOS as s (s.id)}
              <button
                type="button"
                aria-pressed={weather.demo === s.id}
                onclick={() => pickSky(s.id)}
              >
                <WeatherIcon
                  name={s.icon}
                  size={24}
                  primary="currentColor"
                  secondary="currentColor"
                  label=""
                />{s.label}
              </button>
            {/each}
            <button
              type="button"
              aria-pressed={weather.demo === null}
              onclick={() => pickSky(null)}
            >
              <WeatherIcon
                name="windsock"
                size={24}
                primary="currentColor"
                secondary="currentColor"
                label=""
              />Live
            </button>
          </div>
        </div>
      </div>

      <div class="demo">
        <div class="popover" role="region" aria-label="Live app demo">
          <AppCard />
        </div>
        <span class="hint">Swipe or tap a day in the demo.</span>
      </div>
    </section>
  </main>

  <section class="paper" aria-labelledby="features-title">
    <div class="band" aria-hidden="true">
      <ul>
        {#each [...ICON_BAND, ...ICON_BAND] as icon, i (i)}
          <li>
            <WeatherIcon
              name={icon}
              size={40}
              primary="var(--mark)"
              secondary="var(--ink-muted)"
              label=""
            />
          </li>
        {/each}
      </ul>
    </div>

    <div class="inner">
      <span class="eyebrow muted">What's inside</span>
      <h2 id="features-title">Small popover, a whole sky in it.</h2>
      <ul class="features">
        {#each FEATURES as f (f.title)}
          <li class="feature">
            <WeatherIcon
              name={f.icon}
              size={52}
              primary="var(--mark)"
              secondary="var(--ink-muted)"
              label=""
            />
            <h3>{f.title}</h3>
            <p>{f.body}</p>
          </li>
        {/each}
      </ul>
    </div>
  </section>

  <section class="palette" aria-labelledby="palette-title">
    <span class="eyebrow">Design DNA since 2016</span>
    <h2 id="palette-title">
      Nine colors. You feel the forecast before you read it.
    </h2>
    <p class="sub">
      Pick a temperature and the page follows, just like the app.
    </p>
    <div class="swatches" role="group" aria-labelledby="palette-title">
      {#each PALETTE as c (c.hex)}
        <button
          type="button"
          class="swatch"
          aria-pressed={pageColor === c.hex}
          aria-label="Use the color for {c.range}"
          onclick={() => (pageColor = c.hex)}
        >
          <span class="chip" style:background-color={c.hex}>
            <WeatherIcon
              name={c.icon}
              size={32}
              primary={inkOn(c.hex)}
              secondary={inkOn(c.hex) === '#ffffff'
                ? 'rgba(255,255,255,0.55)'
                : 'rgba(31,38,48,0.45)'}
              label=""
            />
          </span>
          <span class="range">{c.range}</span>
        </button>
      {/each}
    </div>
  </section>

  <section class="panel shortcuts" aria-labelledby="keys-title">
    <h2 id="keys-title">Keyboard-first</h2>
    <ul>
      {#each SHORTCUTS as s (s.keys)}
        <li><kbd>{s.keys}</kbd><span>{s.label}</span></li>
      {/each}
    </ul>
  </section>

  <footer class="credits">
    <p>
      Weather data by
      <a href="https://open-meteo.com" target="_blank" rel="noreferrer"
        >Open-Meteo.com</a
      >
      (CC&nbsp;BY&nbsp;4.0). Icons:
      <a
        href="https://github.com/konradmichalik/weather-iconic"
        target="_blank"
        rel="noreferrer">weather-iconic</a
      >. The original
      <a
        href="https://github.com/konradmichalik/temps-legacy"
        target="_blank"
        rel="noreferrer">temps (2016)</a
      >.
    </p>
    <p class="fine">© {new Date().getFullYear()} Konrad Michalik · MIT</p>
  </footer>
</div>

<style>
  .page {
    --chip: rgba(255, 255, 255, 0.16);
    --chip-on: #ffffff;
    --rule: rgba(255, 255, 255, 0.24);
    min-height: 100dvh;
    transition:
      background-color 600ms ease,
      color 600ms ease;
    padding: 0 clamp(16px, 5vw, 64px);
    display: flex;
    flex-direction: column;
  }
  .page.dark {
    --chip: rgba(31, 38, 48, 0.08);
    --chip-on: var(--ink);
    --rule: rgba(31, 38, 48, 0.16);
  }
  a {
    color: inherit;
  }
  a:focus-visible,
  button:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 3px;
  }

  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
    padding: 14px 0;
  }
  .wordmark {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 22px;
    font-weight: 500;
    letter-spacing: -0.02em;
  }
  .topbar nav {
    display: flex;
    gap: 4px;
  }
  .topbar a {
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    padding: 0 10px;
    text-decoration: none;
    font-size: 15px;
  }
  .topbar a:hover {
    text-decoration: underline;
  }

  .hero {
    display: grid;
    grid-template-columns: 1.1fr 0.9fr;
    gap: clamp(24px, 5vw, 72px);
    align-items: center;
    padding: clamp(24px, 6vh, 72px) 0;
  }
  .version {
    display: inline-block;
    font-size: 13px;
    font-weight: 500;
    padding: 4px 12px;
    border-radius: 999px;
    background: var(--chip);
    margin-bottom: 18px;
  }
  h1 {
    font-size: clamp(36px, 5vw, 64px);
    font-weight: 500;
    line-height: 1.04;
    letter-spacing: -0.03em;
  }
  .lede {
    margin-top: 18px;
    max-width: 46ch;
    font-size: clamp(16px, 1.5vw, 18px);
    line-height: 1.55;
  }
  .install {
    margin-top: 28px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    max-width: 520px;
    padding: 8px 8px 8px 18px;
    border-radius: 14px;
    background: var(--chip);
  }
  .install code {
    flex: 1 1 240px;
    min-width: 0;
    font-family: ui-monospace, 'SF Mono', Menlo, monospace;
    font-size: 14px;
    overflow-wrap: anywhere;
  }
  .install button {
    min-height: 44px;
    padding: 0 18px;
    border-radius: 10px;
    background: var(--chip-on);
    color: var(--ink);
    font-size: 14px;
    font-weight: 500;
  }
  .page.dark .install button {
    color: #ffffff;
  }
  .platform {
    margin-top: 14px;
    font-size: 14px;
    line-height: 1.6;
  }
  .platform a {
    font-weight: 500;
  }
  .sky {
    margin-top: 26px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .eyebrow {
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .eyebrow.muted {
    color: var(--ink-muted);
  }
  .scenarios {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .scenarios button {
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 0 16px 0 10px;
    border-radius: 999px;
    background: var(--chip);
    font-size: 14px;
    font-weight: 500;
  }
  .scenarios button[aria-pressed='true'] {
    background: var(--chip-on);
    color: var(--ink);
  }
  .page.dark .scenarios button[aria-pressed='true'] {
    color: #ffffff;
  }

  .demo {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
  .popover {
    position: relative;
    filter: drop-shadow(0 24px 60px rgba(0, 0, 0, 0.3));
  }
  .hint {
    font-size: 13px;
  }

  /* White paper band: icon strip and features, like the app's paper zone. */
  .paper {
    margin: 24px calc(-1 * clamp(16px, 5vw, 64px)) 0;
    background: var(--paper);
    color: var(--ink);
  }
  .band {
    overflow: hidden;
    padding: 26px 0;
  }
  .band ul {
    list-style: none;
    padding: 0;
    display: flex;
    gap: 12px;
    width: max-content;
  }
  .band li {
    width: 72px;
    height: 72px;
    flex: none;
    border-radius: 16px;
    background: var(--tile);
    display: grid;
    place-items: center;
  }
  .inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 32px clamp(16px, 5vw, 64px) 72px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  h2 {
    font-size: clamp(28px, 4vw, 44px);
    font-weight: 500;
    letter-spacing: -0.02em;
    line-height: 1.1;
    max-width: 22ch;
  }
  .features {
    list-style: none;
    padding: 0;
    margin-top: 22px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
    gap: 14px;
  }
  .feature {
    padding: 24px;
    border-radius: 20px;
    background: var(--tile);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .feature h3 {
    font-size: 20px;
    font-weight: 500;
    letter-spacing: -0.01em;
  }
  .feature p {
    font-size: 15px;
    line-height: 1.55;
    color: var(--ink-muted);
  }

  .palette {
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    padding: 72px 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .sub {
    font-size: 16px;
  }
  .swatches {
    margin-top: 20px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(92px, 1fr));
    gap: 10px;
  }
  .swatch {
    display: flex;
    flex-direction: column;
    gap: 10px;
    text-align: left;
  }
  /* The hairline keeps the swatch visible when it matches the page color. */
  .chip {
    height: 104px;
    border-radius: 18px;
    box-shadow: inset 0 0 0 1px var(--rule);
    padding: 14px;
    display: flex;
    align-items: flex-start;
  }
  .swatch[aria-pressed='true'] .chip {
    outline: 3px solid currentColor;
    outline-offset: 3px;
  }
  .range {
    font-size: 15px;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }

  .panel {
    background: rgba(255, 255, 255, 0.94);
    color: var(--ink);
    border-radius: 16px;
    padding: clamp(24px, 4vw, 40px);
    margin: 0 0 14px;
  }
  .shortcuts h2 {
    font-size: 19px;
    margin-bottom: 8px;
  }
  .shortcuts ul {
    list-style: none;
    padding: 0;
    margin-top: 16px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 10px 28px;
  }
  .shortcuts li {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    color: var(--ink-muted);
  }
  kbd {
    font-family: ui-monospace, 'SF Mono', Menlo, monospace;
    font-size: 12px;
    min-width: 52px;
    text-align: center;
    padding: 4px 8px;
    border-radius: 6px;
    background: var(--tile);
    color: var(--ink);
  }

  .credits {
    padding: 32px 0 40px;
    border-top: 1px solid var(--rule);
    text-align: center;
    font-size: 14px;
    line-height: 1.6;
  }
  .fine {
    margin-top: 6px;
    font-size: 12px;
  }

  @keyframes band {
    to {
      transform: translateX(-50%);
    }
  }
  @media (prefers-reduced-motion: no-preference) {
    .motion .band ul {
      animation: band 48s linear infinite;
    }
    .band:hover ul {
      animation-play-state: paused;
    }
    .scenarios button,
    .swatch {
      transition: transform 200ms var(--ease-out);
    }
    .scenarios button:hover {
      transform: translateY(-1px);
    }
    .swatch:hover {
      transform: translateY(-6px);
    }
  }
  /* Without motion the band wraps into a static grid of every icon once. */
  @media (prefers-reduced-motion: reduce) {
    .band ul {
      width: auto;
      flex-wrap: wrap;
      justify-content: center;
      padding: 0 16px;
    }
    .band li:nth-child(n + 29) {
      display: none;
    }
  }

  @media (max-width: 860px) {
    .hero {
      grid-template-columns: 1fr;
    }
    .demo {
      order: -1;
    }
  }
</style>
