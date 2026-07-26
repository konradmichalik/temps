<script lang="ts">
  import type { WeatherData } from '../../services/open-meteo';
  import { wmoToIcon, wmoToLabel } from '../../utils/wmo-icons';
  import { formatDateLine, formatDayShort } from '../../utils/time';
  import { settings } from '../../stores/settings.svelte';
  import WeatherIcon from '../ui/WeatherIcon.svelte';
  import NowcastBar from '../ui/NowcastBar.svelte';

  interface Props {
    data: WeatherData;
    accent: string;
    accentDeep?: string;
    active?: boolean;
  }

  let { data, accent, accentDeep = accent, active = true }: Props = $props();

  const c = $derived(data.current);
  const forecast = $derived(data.daily.slice(1, 5));
  const feelsDiff = $derived(
    Math.abs(c.apparentTemperature - c.temperature) >= 3,
  );
</script>

<div class="color-zone" class:in={active}>
  <div class="hero">
    <span class="st" style:--d="0ms"
      ><WeatherIcon name={wmoToIcon(c.weatherCode, c.isDay)} size={64} /></span
    >
    <div class="reading">
      <span class="temp st" style:--d="70ms">{Math.round(c.temperature)}°</span>
      <span class="rule st" style:--d="150ms"></span>
      <span class="condition st" style:--d="200ms"
        >{wmoToLabel(c.weatherCode, settings.locale)}</span
      >
      {#if feelsDiff}
        <span class="feels st" style:--d="260ms"
          >{settings.locale === 'de' ? 'gefühlt' : 'feels like'}
          {Math.round(c.apparentTemperature)}°</span
        >
      {/if}
      <span class="st" style:--d="300ms">
        <NowcastBar slots={data.minutely15} />
      </span>
    </div>
  </div>
</div>

<div class="paper-zone" class:in={active}>
  <div class="meta st" style:--d="240ms">
    <span
      >{formatDateLine(
        data.daily[0].date,
        data.timezone,
        settings.locale,
      )}</span
    >
    <span>{data.place.name.toLowerCase()}, {data.place.country}</span>
  </div>
  <ul class="forecast">
    {#each forecast as day (day.date.getTime())}
      <li class="st" style:--d="{300 + forecast.indexOf(day) * 70}ms">
        <span class="day"
          >{formatDayShort(day.date, data.timezone, settings.locale)}</span
        >
        <WeatherIcon
          name={wmoToIcon(day.weatherCode, true)}
          size={28}
          secondary={accent}
          primary={accentDeep}
        />
        <span class="max" style:color={accent}>{Math.round(day.tempMax)}°</span>
      </li>
    {/each}
  </ul>
</div>

<style>
  /* Staggered entrance: each element fades/rises on its own beat when the
     screen becomes active; leaving screens fade out fast (no delay). */
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
  .hero {
    display: flex;
    align-items: flex-start;
    gap: 18px;
    transform: translateY(-10px);
  }
  .reading {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .temp {
    font-size: clamp(56px, 18.8cqw, 86px);
    font-weight: 300;
    color: var(--ink-strong);
    line-height: 1;
  }
  .rule {
    width: 26px;
    height: 1px;
    background: var(--ink-faint);
    margin: 10px 0 8px;
  }
  .condition {
    font-size: clamp(13px, 4.4cqw, 18px);
    color: var(--ink-soft);
  }
  .feels {
    margin-top: 4px;
    font-size: 11px;
    color: var(--ink-faint);
  }

  .paper-zone {
    flex: 1;
    padding: 6px 22px 22px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .meta {
    display: flex;
    justify-content: space-between;
    font-size: clamp(11px, 3.5cqw, 14px);
    color: var(--paper-ink);
  }
  .forecast {
    list-style: none;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
  }
  .forecast li {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 4px 0;
  }
  .forecast li:not(:last-child) {
    border-right: 1px solid rgba(0, 0, 0, 0.06);
  }
  .day {
    font-size: 10px;
    color: var(--paper-ink);
    text-transform: lowercase;
  }
  .max {
    font-size: clamp(12px, 3.8cqw, 16px);
  }
</style>
