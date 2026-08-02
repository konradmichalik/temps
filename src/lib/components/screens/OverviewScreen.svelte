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
  const de = $derived(settings.locale === 'de');

  // Forecast stays minimal (day · icon · high); tapping a day opens a small
  // modal with the full detail, so the base layout never shifts.
  let openDay = $state<number | null>(null);
  const detail = $derived(openDay !== null ? forecast[openDay] : null);
  let closeBtn = $state<HTMLButtonElement>();

  $effect(() => {
    if (detail) closeBtn?.focus();
  });
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === 'Escape' && openDay !== null) openDay = null;
  }}
/>

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
          aria-haspopup="dialog"
          aria-label="{formatDayShort(
            day.date,
            data.timezone,
            settings.locale,
          )}, {Math.round(day.tempMax)}°"
          onclick={() => (openDay = i)}
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
</div>

{#if detail}
  <div class="modal" role="dialog" aria-modal="true" aria-label="Day forecast">
    <button
      class="backdrop"
      aria-label={de ? 'Schließen' : 'Close'}
      onclick={() => (openDay = null)}
    ></button>
    <div class="sheet">
      <button
        class="x"
        bind:this={closeBtn}
        aria-label={de ? 'Schließen' : 'Close'}
        onclick={() => (openDay = null)}
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" />
        </svg>
      </button>

      <div class="head">
        <WeatherIcon
          name={wmoToIcon(detail.weatherCode, true)}
          size={40}
          secondary={accent}
          primary={accentDeep}
        />
        <div>
          <div class="date">
            {formatDateLine(detail.date, data.timezone, settings.locale)}
          </div>
          <div class="cond">
            {wmoToLabel(detail.weatherCode, settings.locale)}
          </div>
        </div>
      </div>

      <div class="stats">
        <div class="stat">
          <span class="v" style:color={accentDeep}
            >{Math.round(detail.tempMax)}°</span
          >
          <span class="k">{de ? 'Höchst' : 'high'}</span>
        </div>
        <div class="stat">
          <span class="v">{Math.round(detail.tempMin)}°</span>
          <span class="k">{de ? 'Tiefst' : 'low'}</span>
        </div>
        <div class="stat">
          <span class="v"
            >{Math.round(detail.precipitationProbabilityMax)}%</span
          >
          <span class="k">{de ? 'Regen' : 'rain'}</span>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
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
    padding: 6px 0;
    border-radius: 8px;
    cursor: pointer;
    transition: background 160ms ease;
  }
  .tile:hover,
  .tile:focus-visible {
    background: rgba(0, 0, 0, 0.04);
  }
  .day {
    font-size: 10px;
    color: var(--paper-ink);
    text-transform: lowercase;
  }
  .max {
    font-size: clamp(12px, 3.8cqw, 16px);
  }

  /* Detail modal: overlays the slide (doesn't shift the base layout). */
  .modal {
    position: absolute;
    inset: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fade 160ms ease;
  }
  .backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.28);
    border: none;
    cursor: pointer;
  }
  .sheet {
    position: relative;
    z-index: 1;
    width: 78%;
    max-width: 270px;
    background: var(--paper);
    border-radius: 16px;
    padding: 18px 18px 20px;
    box-shadow: 0 16px 44px rgba(0, 0, 0, 0.28);
    animation: pop 180ms ease;
  }
  .x {
    position: absolute;
    top: 8px;
    right: 8px;
    padding: 4px;
    color: var(--paper-ink);
  }
  .x svg {
    fill: none;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .date {
    font-size: 14px;
    font-weight: 500;
    color: var(--paper-ink-strong);
  }
  .cond {
    font-size: 12px;
    color: var(--paper-ink);
  }
  .stats {
    display: flex;
    justify-content: space-between;
    margin-top: 16px;
  }
  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }
  .stat .v {
    font-size: 20px;
    font-weight: 500;
    color: var(--paper-ink-strong);
  }
  .stat .k {
    font-size: 10px;
    color: var(--paper-ink);
    text-transform: lowercase;
  }

  @keyframes fade {
    from {
      opacity: 0;
    }
  }
  @keyframes pop {
    from {
      opacity: 0;
      transform: translateY(8px) scale(0.96);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .modal,
    .sheet {
      animation: none;
    }
    .tile {
      transition: none;
    }
  }
</style>
