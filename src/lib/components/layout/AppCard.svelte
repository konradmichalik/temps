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
  import OverviewScreen from '../screens/OverviewScreen.svelte';
  import HourlyScreen from '../screens/HourlyScreen.svelte';
  import DetailsScreen from '../screens/DetailsScreen.svelte';
  import SettingsView from '../settings/SettingsView.svelte';
  import { weather } from '../../stores/weather.svelte';
  import { settings } from '../../stores/settings.svelte';
  import { air } from '../../stores/air.svelte';
  import { tempToColor, darken } from '../../utils/temp-color';
  import { formatTime } from '../../utils/time';

  interface Props {
    /** Responsive full-viewport mode (standalone web app). */
    standalone?: boolean;
    /** Bindable so the Tauri tray "Settings" item can open the overlay. */
    settingsOpen?: boolean;
  }

  let { standalone = false, settingsOpen = $bindable(false) }: Props = $props();

  let now = $state(new Date());

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

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') settingsOpen = false;
    else if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      settingsOpen = !settingsOpen;
    }
  }

  const data = $derived(weather.data);
  /** Accent for content on white: always the day palette color. */
  const accent = $derived(
    data ? tempToColor(data.current.temperature, settings.unit) : '#80BBB2',
  );
  /** Darkened sibling — the highlight tone of the two-tone accent pair. */
  const accentDeep = $derived(darken(accent, 0.18));
</script>

{#snippet overview(active: boolean)}
  {#if data}<OverviewScreen {data} {accent} {accentDeep} {active} />{/if}
{/snippet}
{#snippet hourly(active: boolean)}
  {#if data}<HourlyScreen {data} {accent} {accentDeep} {active} />{/if}
{/snippet}
{#snippet details(active: boolean)}
  {#if data}<DetailsScreen {data} {accent} {accentDeep} {active} />{/if}
{/snippet}

<svelte:window onkeydown={onKeydown} />

<div class="card" class:standalone style:background-color={weather.bgColor}>
  <div class="fx-zone">
    <EffectsLayer kind={weather.effect} enabled={settings.effectsEnabled} />
    <Waves animated={settings.waveAnimation} />
  </div>
  <div class="paper-backdrop"></div>

  {#if data}
    <Carousel screens={[overview, hourly, details]} dotColor={accent} />
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
      onclose={() => (settingsOpen = false)}
    />
  {/if}
</div>

<style>
  .card {
    position: relative;
    width: var(--popover-width);
    height: var(--popover-height);
    --color-zone: 58%;
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
