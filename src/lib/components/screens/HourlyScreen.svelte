<script lang="ts">
  import type { WeatherData } from '../../services/open-meteo';
  import { settings } from '../../stores/settings.svelte';
  import HourlyChart from '../ui/HourlyChart.svelte';

  interface Props {
    data: WeatherData;
    accent: string;
    accentDeep?: string;
    active?: boolean;
  }

  let { data, accent, accentDeep = accent, active = true }: Props = $props();

  const next24 = $derived.by(() => {
    const now = Date.now();
    const start = data.hourly.findIndex(
      (h) => h.time.getTime() >= now - 30 * 60_000,
    );
    return data.hourly.slice(Math.max(start, 0), Math.max(start, 0) + 24);
  });
</script>

<div class="hero-spacer"></div>

<div class="paper-zone" class:in={active}>
  <HourlyChart
    points={next24}
    timezone={data.timezone}
    color={accent}
    colorDeep={accentDeep}
    locale={settings.locale}
    {active}
  />
</div>

<style>
  /* Reserves the color zone; the shared hero (in AppCard) paints over it. */
  .hero-spacer {
    height: var(--color-zone);
    flex: none;
  }
  /* No horizontal padding: the temperature line runs full-bleed, edge to edge
     (HourlyChart clamps its tooltip so it stays inside the card). The chart is
     centered vertically so it doesn't float at the top of a tall paper area. */
  .paper-zone {
    flex: 1;
    padding: 14px 0 20px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
</style>
