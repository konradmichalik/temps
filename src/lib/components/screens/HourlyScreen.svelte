<script lang="ts">
  import type { WeatherData } from '../../services/open-meteo';
  import { wmoToIcon } from '../../utils/wmo-icons';
  import { settings } from '../../stores/settings.svelte';
  import WeatherIcon from '../ui/WeatherIcon.svelte';
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

<div class="color-zone" class:in={active}>
  <div class="compact">
    <span class="st" style:--d="0ms"
      ><WeatherIcon name={wmoToIcon(c.weatherCode, c.isDay)} size={44} /></span
    >
    <span class="temp st" style:--d="80ms">{Math.round(c.temperature)}°</span>
  </div>
</div>

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
  .st {
    opacity: 0;
    transform: translateY(10px);
    transition:
      opacity 260ms ease,
      transform 260ms ease;
    transition-delay: 0ms;
  }
  .in .st {
    opacity: 1;
    transform: translateY(0);
    transition-duration: 420ms;
    transition-delay: var(--d);
  }

  .color-zone {
    height: var(--color-zone);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .compact {
    display: flex;
    align-items: center;
    gap: 14px;
    transform: translateY(-16px);
  }
  .temp {
    font-size: clamp(42px, 14cqw, 64px);
    font-weight: 300;
    color: var(--ink-strong);
  }
  .paper-zone {
    flex: 1;
    padding: 14px 12px 20px;
  }
</style>
