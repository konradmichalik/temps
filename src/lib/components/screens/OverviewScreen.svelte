<script lang="ts">
  import type { WeatherData } from '../../services/open-meteo';
  import { wmoToIcon } from '../../utils/wmo-icons';
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

  // Which forecast tile is pinned open (tap/click). Hover + keyboard focus
  // reveal the low temp via CSS; this handles touch and a sticky click.
  let pinned = $state<number | null>(null);
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
    <span>{data.place.name.toLowerCase()}, {data.place.country}</span>
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
          {Math.round(day.tempMax)}° / {Math.round(day.tempMin)}°"
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
          <span class="min">{Math.round(day.tempMin)}°</span>
        </button>
      </li>
    {/each}
  </ul>
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
    gap: 18px;
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
    padding: 4px 0;
    cursor: pointer;
  }
  .day {
    font-size: 10px;
    color: var(--paper-ink);
    text-transform: lowercase;
  }
  .max {
    font-size: clamp(12px, 3.8cqw, 16px);
  }
  /* Low temp: revealed on hover, keyboard focus, or a sticky tap (.pinned).
     Its line is always reserved, so revealing it never shifts the layout. */
  .min {
    font-size: clamp(11px, 3.4cqw, 14px);
    color: var(--paper-ink);
    opacity: 0;
    transition: opacity 160ms ease;
  }
  .tile:hover .min,
  .tile:focus-visible .min,
  .tile.pinned .min {
    opacity: 1;
  }
  @media (prefers-reduced-motion: reduce) {
    .min {
      transition: none;
    }
  }
</style>
