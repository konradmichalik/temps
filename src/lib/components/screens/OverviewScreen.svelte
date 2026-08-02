<script lang="ts">
  import type { WeatherData } from '../../services/open-meteo';
  import { wmoToIcon, wmoToLabel } from '../../utils/wmo-icons';
  import { formatDateLine, formatDayShort } from '../../utils/time';
  import { settings } from '../../stores/settings.svelte';
  import WeatherIcon from '../ui/WeatherIcon.svelte';
  import CurrentReading from '../ui/CurrentReading.svelte';

  interface Props {
    data: WeatherData;
    accent: string;
    accentDeep?: string;
    active?: boolean;
  }

  let { data, accent, accentDeep = accent, active = true }: Props = $props();

  const c = $derived(data.current);
  const forecast = $derived(data.daily.slice(1, 5));

  // Tap/click a day to pin its detail panel (high/low + rain chance); tap again
  // to close. Kept in range so a data refresh can't point at a missing day.
  let pinned = $state<number | null>(null);
  const selected = $derived(
    pinned !== null && pinned < forecast.length ? forecast[pinned] : null,
  );

  const de = $derived(settings.locale === 'de');
</script>

<CurrentReading current={c} nowcast={data.minutely15} {active} />

<div class="paper-zone" class:in={active}>
  <div class="meta st" style:--d="240ms">
    <span
      >{formatDateLine(
        data.daily[0].date,
        data.timezone,
        settings.locale,
      )}</span
    >
    <span>{data.place.name.toLowerCase()}</span>
  </div>

  <ul class="forecast">
    {#each forecast as day, i (day.date.getTime())}
      <li class="st" style:--d="{300 + i * 70}ms">
        <button
          type="button"
          class="tile"
          class:pinned={pinned === i}
          aria-pressed={pinned === i}
          aria-label="{formatDayShort(
            day.date,
            data.timezone,
            settings.locale,
          )}:
          {de ? 'max' : 'high'} {Math.round(day.tempMax)}°, {de
            ? 'min'
            : 'low'} {Math.round(day.tempMin)}°, {de ? 'Regen' : 'rain'}
          {Math.round(day.precipitationProbabilityMax)}%"
          onclick={() => (pinned = pinned === i ? null : i)}
        >
          <span class="day"
            >{formatDayShort(day.date, data.timezone, settings.locale)}</span
          >
          <WeatherIcon
            name={wmoToIcon(day.weatherCode, true)}
            size={28}
            secondary={accent}
            primary={accentDeep}
          />
          <span class="max" style:color={accent}
            >{Math.round(day.tempMax)}°</span
          >
        </button>
      </li>
    {/each}
  </ul>

  {#if selected}
    <div class="detail">
      <span class="d-cond">
        <WeatherIcon
          name={wmoToIcon(selected.weatherCode, true)}
          size={22}
          secondary={accent}
          primary={accentDeep}
        />
        {wmoToLabel(selected.weatherCode, settings.locale)}
      </span>
      <span class="d-stats">
        <span class="d-temps">
          <span style:color={accent}>{Math.round(selected.tempMax)}°</span> /
          {Math.round(selected.tempMin)}°
        </span>
        <span class="d-rain">
          <WeatherIcon
            name="umbrella"
            size={14}
            secondary={accent}
            primary={accentDeep}
          />
          {Math.round(selected.precipitationProbabilityMax)}%
        </span>
      </span>
    </div>
  {/if}
</div>

<style>
  /* Center the date + forecast block vertically so it isn't top-loaded with a
     wide band of empty white beneath it. */
  .paper-zone {
    flex: 1;
    padding: 6px 22px 22px;
    display: flex;
    flex-direction: column;
    justify-content: center;
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
  .forecast li:not(:last-child) {
    border-right: 1px solid rgba(0, 0, 0, 0.06);
  }
  .tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 6px 0;
    border-radius: 8px;
    cursor: pointer;
    transition: background 160ms ease;
  }
  .tile.pinned {
    background: rgba(0, 0, 0, 0.05);
  }
  .day {
    font-size: 10px;
    color: var(--paper-ink);
    text-transform: lowercase;
  }
  .max {
    font-size: clamp(12px, 3.8cqw, 16px);
  }

  /* Detail for the tapped day: condition + high/low + rain chance. */
  .detail {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-radius: 10px;
    background: rgba(0, 0, 0, 0.04);
    font-size: 12px;
    color: var(--paper-ink-strong);
  }
  .d-cond {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .d-stats {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 12px;
    white-space: nowrap;
  }
  .d-temps {
    font-weight: 500;
  }
  .d-rain {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  @media (prefers-reduced-motion: reduce) {
    .tile {
      transition: none;
    }
  }
</style>
