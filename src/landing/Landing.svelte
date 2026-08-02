<script lang="ts">
  /**
   * Landing page. The hero is the *real* app (same AppCard component, browser
   * fetch path) framed as a menubar popover, so the demo is always live. The
   * page background follows the demo's temperature color — the page shows off
   * the color concept by being it.
   */
  import { onMount } from 'svelte';
  import AppCard from '../lib/components/layout/AppCard.svelte';
  import { weather } from '../lib/stores/weather.svelte';
  import { APP_VERSION } from '../lib/version';
  import type { DemoScenario } from '../lib/utils/demo-data';

  const VERSION = APP_VERSION;
  const REPO = 'https://github.com/konradmichalik/temps';

  const SCENARIOS: { id: DemoScenario; label: string }[] = [
    { id: 'sunny', label: 'Sunny' },
    { id: 'rain', label: 'Rain' },
    { id: 'snow', label: 'Snow' },
    { id: 'thunder', label: 'Thunder' },
    { id: 'night', label: 'Night' },
  ];

  const FEATURES = [
    {
      title: 'Overview',
      body: 'Full-bleed temperature color, the current condition, and a four-day forecast under a drifting wave silhouette.',
    },
    {
      title: 'Hourly',
      body: 'A hand-rolled SVG chart (no chart library) for the next 24 hours, with a gliding tooltip that tracks your pointer.',
    },
    {
      title: 'Details',
      body: 'Wind, feels-like, humidity, pressure, UV, sunrise/sunset and the moon phase — plus air quality and pollen in Europe.',
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

  let copied = $state(false);
  const brew = 'brew install konradmichalik/tap/temps';

  onMount(() => {
    const param = new URLSearchParams(location.search).get('demo');
    if (param && SCENARIOS.some((s) => s.id === param)) {
      weather.setDemo(param as DemoScenario);
    } else {
      weather.load();
    }
  });

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

<div class="page" style:background-color={weather.bgColor}>
  <header class="topbar">
    <span class="wordmark">temps</span>
    <nav>
      <a href={REPO} target="_blank" rel="noreferrer">GitHub</a>
      <a href="{REPO}/releases" target="_blank" rel="noreferrer">Download</a>
    </nav>
  </header>

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
        <button onclick={copyBrew} aria-label="Copy install command">
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <p class="platform">
        macOS 13+ · Apple Silicon &amp; Intel · MIT licensed
      </p>
    </div>

    <div class="demo">
      <div class="popover" aria-label="Live app demo">
        <span class="tray-arrow" aria-hidden="true"></span>
        <AppCard />
      </div>
      <div class="scenarios" role="group" aria-label="Demo weather">
        {#each SCENARIOS as s (s.id)}
          <button
            class:on={weather.demo === s.id}
            onclick={() => weather.setDemo(s.id)}>{s.label}</button
          >
        {/each}
        <button class:on={weather.demo === null} onclick={() => weather.load()}
          >Live</button
        >
      </div>
    </div>
  </section>

  <section class="panel features">
    {#each FEATURES as f (f.title)}
      <article>
        <h2>{f.title}</h2>
        <p>{f.body}</p>
      </article>
    {/each}
  </section>

  <section class="panel shortcuts">
    <h2>Keyboard-first</h2>
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
    min-height: 100dvh;
    transition: var(--bg-transition);
    color: var(--ink-strong);
    padding: 0 clamp(16px, 5vw, 64px);
    display: flex;
    flex-direction: column;
  }

  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 22px 0;
  }
  .wordmark {
    font-size: 22px;
    font-weight: 500;
    letter-spacing: 0.5px;
  }
  .topbar nav {
    display: flex;
    gap: 20px;
  }
  .topbar a {
    color: var(--ink-soft);
    text-decoration: none;
    font-size: 15px;
  }
  .topbar a:hover {
    color: var(--ink-strong);
  }

  .hero {
    display: grid;
    grid-template-columns: 1.1fr 0.9fr;
    gap: clamp(24px, 5vw, 72px);
    align-items: center;
    padding: clamp(24px, 6vh, 72px) 0;
    flex: 1;
  }
  .version {
    display: inline-block;
    font-size: 12px;
    padding: 3px 10px;
    border-radius: 99px;
    background: rgba(255, 255, 255, 0.18);
    color: var(--ink-strong);
    margin-bottom: 18px;
  }
  h1 {
    font-size: clamp(30px, 4.4vw, 52px);
    font-weight: 300;
    line-height: 1.08;
    letter-spacing: -0.5px;
  }
  .lede {
    margin-top: 18px;
    max-width: 46ch;
    font-size: clamp(15px, 1.5vw, 18px);
    line-height: 1.55;
    color: var(--ink-soft);
  }

  .install {
    margin-top: 28px;
    display: inline-flex;
    align-items: stretch;
    background: rgba(0, 0, 0, 0.16);
    border-radius: 10px;
    overflow: hidden;
    max-width: 100%;
  }
  .install code {
    padding: 12px 16px;
    font-family: ui-monospace, 'SF Mono', Menlo, monospace;
    font-size: 13px;
    color: var(--ink-strong);
    white-space: nowrap;
    overflow-x: auto;
  }
  .install button {
    padding: 0 16px;
    background: rgba(255, 255, 255, 0.16);
    color: var(--ink-strong);
    font-size: 13px;
    white-space: nowrap;
  }
  .install button:hover {
    background: rgba(255, 255, 255, 0.28);
  }
  .platform {
    margin-top: 16px;
    font-size: 13px;
    color: var(--ink-faint);
  }

  .demo {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 18px;
  }
  .popover {
    position: relative;
    filter: drop-shadow(0 24px 60px rgba(0, 0, 0, 0.3));
  }
  .tray-arrow {
    position: absolute;
    top: -9px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 9px solid transparent;
    border-right: 9px solid transparent;
    border-bottom: 9px solid #fff;
    z-index: 2;
  }
  .scenarios {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
  }
  .scenarios button {
    font-size: 12px;
    padding: 5px 12px;
    border-radius: 99px;
    background: rgba(255, 255, 255, 0.16);
    color: var(--ink-soft);
  }
  .scenarios button.on {
    background: #fff;
    color: #374151;
  }

  .panel {
    background: rgba(255, 255, 255, 0.94);
    color: var(--paper-ink-strong);
    border-radius: 16px;
    padding: clamp(24px, 4vw, 40px);
    margin: 14px 0;
  }
  .features {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: clamp(20px, 3vw, 40px);
  }
  .features h2,
  .shortcuts h2 {
    font-size: 19px;
    font-weight: 500;
    margin-bottom: 8px;
  }
  .features p {
    color: var(--paper-ink);
    font-size: 15px;
    line-height: 1.55;
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
    color: var(--paper-ink);
  }
  kbd {
    font-family: ui-monospace, 'SF Mono', Menlo, monospace;
    font-size: 12px;
    min-width: 52px;
    text-align: center;
    padding: 4px 8px;
    border-radius: 6px;
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    color: var(--paper-ink-strong);
  }

  .credits {
    padding: 32px 0 40px;
    text-align: center;
    color: var(--ink-soft);
    font-size: 14px;
    line-height: 1.6;
  }
  .credits a {
    color: var(--ink-strong);
  }
  .fine {
    margin-top: 6px;
    font-size: 12px;
    color: var(--ink-faint);
  }

  @media (max-width: 860px) {
    .hero {
      grid-template-columns: 1fr;
      text-align: center;
    }
    .pitch {
      order: 2;
    }
    .demo {
      order: 1;
    }
    .lede {
      margin-inline: auto;
    }
    .features {
      grid-template-columns: 1fr;
    }
  }
</style>
