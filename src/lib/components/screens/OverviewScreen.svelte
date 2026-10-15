<script lang="ts">
  import { cubicOut } from 'svelte/easing';
  import type { WeatherData } from '../../services/open-meteo';
  import { wmoToIcon, wmoToLabel } from '../../utils/wmo-icons';
  import { formatDateLine, formatDayShort } from '../../utils/time';
  import { settings } from '../../stores/settings.svelte';
  import WeatherIcon from '../ui/WeatherIcon.svelte';
  import DayChart from '../ui/DayChart.svelte';
  import Meter from '../ui/Meter.svelte';

  interface Props {
    data: WeatherData;
    accent: string;
    accentDeep?: string;
    active?: boolean;
  }

  let { data, accent, accentDeep = accent, active = true }: Props = $props();

  const forecast = $derived(data.daily.slice(1, 5));
  const de = $derived(settings.locale === 'de');

  // Forecast stays minimal (day · icon · high); tapping a day slides up a
  // detail panel over the white area, so the base layout never shifts.
  let openDay = $state<number | null>(null);
  const detail = $derived(openDay !== null ? forecast[openDay] : null);
  let closeBtn = $state<HTMLButtonElement>();

  /** The selected day's hourly points (temperature trend + rain). */
  const dayHours = $derived.by(() => {
    if (!detail) return [];
    // Daily dates sit at local noon; the chart covers that whole local day.
    const start = detail.date.getTime() - 12 * 3600 * 1000;
    const end = start + 24 * 3600 * 1000;
    return data.hourly.filter(
      (h) => h.time.getTime() >= start && h.time.getTime() < end,
    );
  });

  $effect(() => {
    // preventScroll: the sheet still sits below the card while it slides in,
    // and WebKit would scroll the carousel up to reveal the button.
    if (detail) closeBtn?.focus({ preventScroll: true });
  });

  // JS-driven slide (not CSS) so it plays even under the global
  // prefers-reduced-motion rule; translates by measured pixels (no % / cqh) so
  // it behaves identically in every engine.
  function slideUp(node: HTMLElement, { duration = 300 } = {}) {
    const dist = node.offsetHeight;
    return {
      duration,
      easing: cubicOut,
      tick: (t: number) => {
        node.style.transform = `translateY(${(1 - t) * dist}px)`;
      },
    };
  }
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === 'Escape' && openDay !== null) openDay = null;
  }}
/>

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

  <ul
    class="forecast"
    style:--accent-deep={accentDeep}
    style:--track="{accent}4D"
  >
    {#each forecast as day, i (day.date.getTime())}
      <li class="st" style:--d="{300 + i * 70}ms">
        <button
          type="button"
          class="day"
          class:selected={openDay === i}
          aria-haspopup="dialog"
          aria-label="{formatDateLine(
            day.date,
            data.timezone,
            settings.locale,
          )}, {wmoToLabel(day.weatherCode, settings.locale)}, {Math.round(
            day.tempMax,
          )}° / {Math.round(day.tempMin)}°, {de ? 'Regen' : 'rain'} {Math.round(
            day.precipitationProbabilityMax,
          )} %"
          onclick={() => (openDay = i)}
        >
          <span class="dname"
            >{formatDayShort(day.date, data.timezone, settings.locale)}</span
          >
          <WeatherIcon
            name={wmoToIcon(day.weatherCode, true)}
            size={32}
            primary={accentDeep}
            secondary="var(--ink-muted)"
            label=""
          />
          <span class="temps"
            >{Math.round(day.tempMax)}°<small>{Math.round(day.tempMin)}°</small
            ></span
          >
          <Meter
            kind="fill"
            value={day.precipitationProbabilityMax / 100}
            label="{Math.round(day.precipitationProbabilityMax)} %"
            delay={600 + i * 70}
          />
        </button>
      </li>
    {/each}
  </ul>
</div>

{#if detail}
  <div class="sheet-layer">
    <button
      type="button"
      class="scrim"
      aria-label={de ? 'Schließen' : 'Close'}
      onclick={() => (openDay = null)}
    ></button>
    <div
      class="sheet"
      role="dialog"
      aria-modal="true"
      aria-label={formatDateLine(detail.date, data.timezone, settings.locale)}
      style:--accent-deep={accentDeep}
      transition:slideUp
    >
      <button
        type="button"
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
          size={36}
          primary={accentDeep}
          secondary="var(--ink-muted)"
          label=""
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

      {#if dayHours.length > 1}
        <div class="chart-bleed">
          <DayChart
            points={dayHours}
            timezone={data.timezone}
            color={accent}
            colorDeep={accentDeep}
            hour12={settings.hour12}
          />
        </div>
      {/if}

      <dl class="stats">
        {#each [{ icon: 'thermometer-hot', key: de ? 'Höchst' : 'High', value: `${Math.round(detail.tempMax)}°` }, { icon: 'thermometer-cold', key: de ? 'Tiefst' : 'Low', value: `${Math.round(detail.tempMin)}°` }, { icon: 'umbrella', key: de ? 'Regen' : 'Rain', value: `${Math.round(detail.precipitationProbabilityMax)} %` }] as s (s.icon)}
          <div class="stat">
            <dt>
              <WeatherIcon
                name={s.icon}
                size={14}
                primary={accentDeep}
                secondary="var(--ink-muted)"
                label=""
              />{s.key}
            </dt>
            <dd>{s.value}</dd>
          </div>
        {/each}
      </dl>
    </div>
  </div>
{/if}

<style>
  /* The shared hero (in AppCard) owns the color zone; this fills the white area
     below it. Absolutely positioned (not a flex percentage height) so WebKit
     keeps it in place through the detail-sheet open/close reflow. */
  .paper-zone {
    position: absolute;
    top: var(--color-zone);
    left: 0;
    right: 0;
    bottom: 0;
    padding: 6px 12px 22px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 10px;
  }
  .meta {
    display: flex;
    justify-content: space-between;
    padding: 0 4px;
    font-size: clamp(11px, 3.5cqw, 14px);
    color: var(--ink-muted);
  }
  .forecast {
    list-style: none;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 6px;
  }
  /* A forecast day is a tappable tile (docs/design/rules.md#tap-states). */
  .day {
    width: 100%;
    height: 116px;
    padding: 8px 8px 9px;
    border-radius: 12px;
    background: var(--tile);
    color: var(--ink);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
  }
  .day:hover {
    background: var(--tile-hover);
  }
  .day:focus-visible {
    outline: 2px solid var(--ink);
    outline-offset: 2px;
  }
  .day:active {
    background: var(--tile-hover);
  }
  .selected {
    box-shadow: inset 0 0 0 2px var(--accent-deep);
  }
  .day :global(.meter) {
    align-self: stretch;
  }
  .dname {
    font-size: 9px;
    font-weight: 500;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: var(--ink-muted);
  }
  .temps {
    font-size: 17px;
    font-weight: 500;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  .temps small {
    margin-left: 3px;
    font-size: 11px;
    font-weight: 400;
    color: var(--ink-muted);
  }

  @media (prefers-reduced-motion: no-preference) {
    .day {
      transition:
        transform 200ms var(--ease-out),
        background-color 160ms ease;
    }
    .day:hover {
      transform: translateY(-2px);
    }
    .day:active {
      transform: scale(0.97);
    }
  }

  /* Detail sheet: slides up into the white paper area (doesn't shift the base
     layout). A transparent scrim over the color band closes it on outside tap;
     the X is the explicit affordance. */
  .sheet-layer {
    position: absolute;
    inset: 0;
    z-index: 10;
  }
  .scrim {
    position: absolute;
    inset: 0;
    background: transparent;
    border: none;
    cursor: pointer;
  }
  /* Paper rising over the color zone: rounded top, no shadow. Anchored with
     plain percentage top/bottom (no cqh) so it positions identically in every
     engine; the top rides a little into the color zone to give the day chart
     room. */
  .sheet {
    position: absolute;
    left: 0;
    right: 0;
    top: 56%;
    bottom: 0;
    background: var(--paper);
    border-radius: 16px 16px 0 0;
    padding: 14px 22px 20px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 14px;
    will-change: transform;
  }
  /* Day chart runs edge to edge, breaking out of the sheet's side padding. */
  .chart-bleed {
    margin: 0 -22px;
  }
  .x {
    position: absolute;
    top: 6px;
    right: 10px;
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    color: var(--ink-muted);
  }
  .x:hover {
    background: var(--tile);
  }
  .x:focus-visible {
    outline: 2px solid var(--ink);
    outline-offset: 2px;
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
    font-size: clamp(13px, 4cqw, 15px);
    color: var(--paper-ink-strong);
  }
  .cond {
    font-size: clamp(11px, 3.4cqw, 13px);
    color: var(--paper-ink);
  }
  /* Mini stat tiles: eyebrow and value, the first two rows of a tile. */
  .stats {
    margin: 0 -10px;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
  }
  .stat {
    height: 52px;
    padding: 7px 9px;
    border-radius: 12px;
    background: var(--tile);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .stat dt {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 9px;
    font-weight: 500;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: var(--ink-muted);
  }
  .stat dd {
    margin: 0;
    font-size: 17px;
    font-weight: 500;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    color: var(--ink);
  }
</style>
