<script lang="ts">
  /**
   * Standalone web app (app.html): the same AppCard, responsive and
   * installable (manifest, standalone display). Mobile browser chrome
   * follows the temperature color via a live theme-color meta tag.
   */
  import { onMount } from 'svelte';
  import AppCard from './lib/components/layout/AppCard.svelte';
  import { weather } from './lib/stores/weather.svelte';
  import type { Place } from './lib/services/open-meteo';
  import type { DemoScenario } from './lib/utils/demo-data';

  const SCENARIOS: DemoScenario[] = [
    'sunny',
    'rain',
    'snow',
    'thunder',
    'night',
  ];

  let locating = $state(false);

  onMount(() => {
    const q = new URLSearchParams(location.search);
    const demo = q.get('demo');
    const lat = parseFloat(q.get('lat') ?? '');
    const lon = parseFloat(q.get('lon') ?? '');
    if (demo && SCENARIOS.includes(demo as DemoScenario)) {
      weather.setDemo(demo as DemoScenario);
    } else if (Number.isFinite(lat) && Number.isFinite(lon)) {
      // Deep link: cities are shareable / bookmarkable URLs.
      weather.load({
        name: q.get('name') ?? `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
        country: q.get('country') ?? '',
        latitude: lat,
        longitude: lon,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    } else {
      weather.load();
    }
  });

  // Keep the URL in sync so the current city is always shareable.
  $effect(() => {
    if (weather.demo || !weather.data) return;
    const p = weather.place;
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- write-only query builder, no reactivity needed
    const q = new URLSearchParams({
      lat: p.latitude.toFixed(2),
      lon: p.longitude.toFixed(2),
      name: p.name,
    });
    if (p.country) q.set('country', p.country);
    history.replaceState(null, '', `${location.pathname}?${q}`);
  });

  // Browser chrome (address bar / status bar) follows the app color.
  $effect(() => {
    let meta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = weather.bgColor;
  });

  function locate() {
    if (!('geolocation' in navigator) || locating) return;
    locating = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const place: Place = {
          name: 'my location',
          country: '',
          latitude: Math.round(pos.coords.latitude * 100) / 100,
          longitude: Math.round(pos.coords.longitude * 100) / 100,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
        weather.demo = null;
        weather.load(place, true).finally(() => (locating = false));
      },
      () => (locating = false),
      { timeout: 8000 },
    );
  }
</script>

<div class="stage" style:background-color={weather.bgColor}>
  <AppCard standalone />

  <button
    class="locate"
    class:busy={locating}
    onclick={locate}
    aria-label="Use my location"
  >
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
    >
      <path d="M21 3 3 10.5l7 3 3 7L21 3Z" stroke-linejoin="round" />
    </svg>
  </button>
</div>

<style>
  .stage {
    min-height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: var(--bg-transition);
  }

  .locate {
    position: fixed;
    right: calc(14px + env(safe-area-inset-right, 0px));
    bottom: calc(14px + env(safe-area-inset-bottom, 0px));
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    color: rgba(255, 255, 255, 0.9);
    background: rgba(0, 0, 0, 0.14);
    backdrop-filter: blur(4px);
    transition: opacity 200ms ease;
  }
  .locate.busy {
    opacity: 0.4;
    pointer-events: none;
  }
  .locate:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.9);
    outline-offset: 2px;
  }

  /* On desktop the stage shows the darkened color around the card;
     on mobile the card is edge-to-edge and the stage is invisible. */
  @media (max-width: 719px) {
    .stage {
      align-items: stretch;
      justify-content: stretch;
    }
  }
</style>
