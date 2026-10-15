<script lang="ts">
  /**
   * The weather card — shared shell for all three deployment targets:
   *   - Tauri popover (fixed 340x480 at the tray)
   *   - landing page demo (fixed size, framed)
   *   - standalone web app (responsive, fills the viewport on mobile)
   * Layer order (back → front): background color → EffectsLayer (fixed) →
   * paper panel + Waves (fixed) → carousel slides → header + dots.
   * The card is a CSS container; screens scale type via cqw units.
   */
  import { onMount } from 'svelte';
  import Carousel from './Carousel.svelte';
  import EffectsLayer from '../effects/EffectsLayer.svelte';
  import Waves from '../effects/Waves.svelte';
  import CurrentReading from '../ui/CurrentReading.svelte';
  import OverviewScreen from '../screens/OverviewScreen.svelte';
  import HourlyScreen from '../screens/HourlyScreen.svelte';
  import DetailsScreen from '../screens/DetailsScreen.svelte';
  import SettingsView from '../settings/SettingsView.svelte';
  import { weather } from '../../stores/weather.svelte';
  import { settings } from '../../stores/settings.svelte';
  import { favorites } from '../../stores/favorites.svelte';
  import { air } from '../../stores/air.svelte';
  import { tempToColor, accentDeep as deepen } from '../../utils/temp-color';
  import { formatTime } from '../../utils/time';
  import { randomCity } from '../../utils/cities';
  import { isTauri, invoke } from '../../utils/tauri';

  interface Props {
    /** Responsive full-viewport mode (standalone web app). */
    standalone?: boolean;
    /** Bindable so the Tauri tray "Settings" item can open the overlay. */
    settingsOpen?: boolean;
  }

  let { standalone = false, settingsOpen = $bindable(false) }: Props = $props();

  let now = $state(new Date());
  /** Focus the city search when settings is opened via Cmd+F. */
  let focusSearch = $state(false);
  /** Visible carousel screen; drives the shared hero (screens 0 & 1). */
  let activeIndex = $state(0);

  onMount(() => {
    const t = setInterval(() => (now = new Date()), 30_000);
    return () => clearInterval(t);
  });

  // v1.1: air quality & pollen ride along whenever the place changes.
  $effect(() => {
    if (settings.airQualityEnabled && weather.data) {
      air.load(weather.place, weather.demo !== null);
    }
  });

  function loadCity(place: Parameters<typeof weather.load>[0]) {
    weather.demo = null;
    weather.load(place, true);
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      settingsOpen = false;
      return;
    }
    if (!(e.metaKey || e.ctrlKey)) return;

    // Settings toggle works in every build (the overlay owns the search).
    if (e.key === 's') {
      e.preventDefault();
      focusSearch = false;
      settingsOpen = !settingsOpen;
      return;
    }

    // The remaining shortcuts collide with browser shortcuts (Cmd+W/R/F), so
    // they are only active inside the Tauri popover.
    if (!isTauri()) return;

    switch (e.key) {
      case 'f': // open search
        e.preventDefault();
        focusSearch = true;
        settingsOpen = true;
        break;
      case 'g': // my location
        e.preventDefault();
        weather.locate();
        break;
      case 'w': // random city (easter egg)
        e.preventDefault();
        loadCity(randomCity(weather.place));
        break;
      case 'e': // refresh weather data
        e.preventDefault();
        weather.load(weather.place, true);
        break;
      case 'r': // reload the webview
        e.preventDefault();
        location.reload();
        break;
      case 'q': // quit the app
        e.preventDefault();
        void invoke('quit_app');
        break;
      case '1':
      case '2':
      case '3':
      case '4':
      case '5': {
        e.preventDefault();
        const fav = favorites.list[Number(e.key) - 1];
        if (fav) loadCity(fav);
        break;
      }
    }
  }

  const data = $derived(weather.data);
  /** Accent for content on white: always the day palette color. */
  const accent = $derived(
    data ? tempToColor(data.current.temperature, settings.unit) : '#80BBB2',
  );
  /** Marks on the tiles: the accent darkened to 3.3:1 on the tile surface. */
  const accentDeep = $derived(deepen(accent));
</script>

{#snippet overview(active: boolean)}
  {#if data}<OverviewScreen {data} {accent} {accentDeep} {active} />{/if}
{/snippet}
{#snippet hourly(active: boolean)}
  {#if data}<HourlyScreen {data} {accent} {accentDeep} {active} />{/if}
{/snippet}
{#snippet details(active: boolean)}
  {#if data}<DetailsScreen {data} {accent} {accentDeep} {active} {now} />{/if}
{/snippet}

<svelte:window onkeydown={onKeydown} />

<div
  class="card"
  class:standalone
  class:motion={settings.effectsEnabled}
  style:background-color={weather.bgColor}
>
  <div class="fx-zone">
    <EffectsLayer
      kind={weather.effect}
      enabled={settings.effectsEnabled}
      night={data ? !data.current.isDay : false}
    />
    <Waves animated={settings.waveAnimation} />
  </div>
  <div class="paper-backdrop"></div>

  {#if data}
    <!-- Shared hero: the Overview and Hourly screens have an identical top, so
         it lives here as one fixed layer instead of inside each slide — the
         reading stays put while only the lower content swipes (no re-animation
         between them). On Details it hides and replays its entrance when you
         return, driven by `active`. -->
    <div class="shared-hero" aria-hidden="true">
      <CurrentReading
        current={data.current}
        nowcast={data.minutely15}
        active={activeIndex !== 2}
      />
    </div>
    <Carousel
      bind:activeIndex
      screens={[overview, hourly, details]}
      dotColor={accent}
    />
  {/if}

  <header>
    <button
      class="menu"
      aria-label="Settings"
      onclick={() => (settingsOpen = true)}
    >
      <span></span><span></span>
    </button>
    {#if data}
      <span class="clock"
        >{formatTime(now, data.timezone, settings.hour12)}</span
      >
    {/if}
  </header>

  {#if settingsOpen}
    <SettingsView
      {accent}
      {accentDeep}
      autofocus={focusSearch}
      onclose={() => {
        settingsOpen = false;
        focusSearch = false;
      }}
    />
  {/if}
</div>

<style>
  .card {
    position: relative;
    width: var(--popover-width);
    height: var(--popover-height);
    --color-zone: 64%;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 18px 50px rgba(0, 0, 0, 0.25);
    transition: var(--bg-transition);
    container-type: size;
    container-name: card;
  }

  /* Standalone web app: edge-to-edge on mobile, generous card on desktop. */
  .card.standalone {
    width: 100%;
    height: 100dvh;
    max-width: none;
    border-radius: 0;
    box-shadow: none;
    /* Notches / home indicator (iOS): keep header and dots clear. */
    --safe-top: env(safe-area-inset-top, 0px);
    --safe-bottom: env(safe-area-inset-bottom, 0px);
  }
  @media (min-width: 720px) and (min-height: 640px) {
    .card.standalone {
      width: min(94vw, 460px);
      height: min(92dvh, 780px);
      border-radius: 14px;
      box-shadow: 0 24px 70px rgba(0, 0, 0, 0.3);
    }
  }

  /* Fixed layers: effects live only in the color zone; the paper panel and
     waves sit at the color→white edge. Slides scroll above all of these. */
  .fx-zone {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: var(--color-zone);
    z-index: 0;
  }
  .paper-backdrop {
    position: absolute;
    top: var(--color-zone);
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--paper);
    z-index: 0;
  }

  /* Shared hero for the Overview + Hourly screens: fixed in the color zone so
     it doesn't swipe with those slides; only the paper content below moves. Its
     content shows/hides (and replays its entrance) via the CurrentReading's
     `active` flag, so Details — which has its own header — is left clear. */
  .shared-hero {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: var(--color-zone);
    z-index: 2;
    pointer-events: none;
  }

  header {
    position: absolute;
    top: var(--safe-top, 0px);
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 16px;
    pointer-events: none;
    z-index: 3;
  }
  header .menu {
    pointer-events: auto;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 4px;
  }
  header .menu span {
    width: 18px;
    height: 2px;
    background: var(--ink-soft);
    border-radius: 1px;
  }
  header .clock {
    font-size: 13px;
    color: var(--ink-soft);
    font-variant-numeric: tabular-nums;
  }
</style>
