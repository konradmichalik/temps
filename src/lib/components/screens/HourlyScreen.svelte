<script lang="ts">
  import type { WeatherData } from '../../services/open-meteo';
  import { settings } from '../../stores/settings.svelte';
  import CurrentReading from '../ui/CurrentReading.svelte';
  import HourlyChart from '../ui/HourlyChart.svelte';

  interface Props {
    data: WeatherData;
    accent: string;
    accentDeep?: string;
    active?: boolean;
  }

  let { data, accent, accentDeep = accent, active = true }: Props = $props();

  const c = $derived(data.current);
  const next24 = $derived.by(() => {
    const now = Date.now();
    const start = data.hourly.findIndex(
      (h) => h.time.getTime() >= now - 30 * 60_000,
    );
    return data.hourly.slice(Math.max(start, 0), Math.max(start, 0) + 24);
  });
</script>

<CurrentReading current={c} {active} />

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
  /* No horizontal padding: the temperature line runs full-bleed, edge to edge
     (HourlyChart clamps its tooltip so it stays inside the card). */
  .paper-zone {
    flex: 1;
    padding: 14px 0 20px;
  }
</style>
