<script lang="ts">
  /**
   * Sun position over the full day/night cycle, spanning the whole width: a
   * wave around a horizon line. Daytime is the hump above the horizon (sunrise
   * → sunset), night the dip below; the marker rides the curve at the current
   * local time — a rayed sun by day, a crescent by night — so you can read
   * exactly where in the cycle you are.
   *
   * The wave stretches edge-to-edge via preserveAspectRatio="none"; the round
   * marker is a separate, undistorted overlay positioned on the same mapping.
   */
  import { formatTime } from '../../utils/time';
  import { settings } from '../../stores/settings.svelte';
  import WeatherIcon from './WeatherIcon.svelte';

  interface Props {
    sunrise: Date;
    sunset: Date;
    timezone: string;
    accent: string;
    accentDeep: string;
  }

  let { sunrise, sunset, timezone, accent, accentDeep }: Props = $props();

  const W = 120; // viewBox width (stretched to full container width)
  const VB_H = 44; // viewBox height
  const SVG_H = 54; // rendered height in px (marker maps through this)
  const MID = 22; // horizon line
  const DAY_AMP = 14; // hump height above horizon
  const NIGHT_AMP = 9; // dip depth below horizon

  /** Fraction of the local day [0,1) for an instant, in the location's tz. */
  function dayFraction(date: Date): number {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hourCycle: 'h23',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).formatToParts(date);
    const get = (t: string) =>
      Number(parts.find((p) => p.type === t)?.value ?? 0);
    return (get('hour') * 3600 + get('minute') * 60 + get('second')) / 86400;
  }

  const srF = $derived(dayFraction(sunrise));
  const ssF = $derived(dayFraction(sunset));
  const nowF = $derived(dayFraction(new Date()));
  const isDay = $derived(nowF >= srF && nowF <= ssF);

  /** y offset from the horizon for a day fraction: hump by day, dip by night. */
  function curveY(h: number): number {
    const dayLen = ssF - srF;
    if (dayLen > 0 && h >= srF && h <= ssF) {
      const phase = (h - srF) / dayLen;
      return MID - Math.sin(Math.PI * phase) * DAY_AMP;
    }
    const nightLen = 1 - Math.max(dayLen, 0);
    const pos = h > ssF ? h - ssF : h + (1 - ssF);
    const phase = nightLen > 0 ? pos / nightLen : 0;
    return MID + Math.sin(Math.PI * phase) * NIGHT_AMP;
  }

  const path = $derived.by(() => {
    const N = 96;
    let d = '';
    for (let i = 0; i <= N; i++) {
      const h = i / N;
      d += `${i === 0 ? 'M' : 'L'} ${(h * W).toFixed(1)} ${curveY(h).toFixed(1)}`;
    }
    return d;
  });

  // Marker position in the overlay: x as a percentage, y mapped through the
  // rendered height so it lands on the (vertically un-stretched) curve.
  const markerLeft = $derived(nowF * 100);
  const markerTop = $derived((curveY(nowF) / VB_H) * SVG_H);

  // Eight short rays around the sun body (static geometry, colored at runtime).
  const RAYS = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4;
    return {
      x1: Math.cos(a) * 4.8,
      y1: Math.sin(a) * 4.8,
      x2: Math.cos(a) * 7.4,
      y2: Math.sin(a) * 7.4,
    };
  });
</script>

<div class="sunarc">
  <div class="wave">
    <svg
      class="wave-svg"
      viewBox="0 0 {W} {VB_H}"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line
        x1="0"
        y1={MID}
        x2={W}
        y2={MID}
        stroke={accent}
        stroke-width="1"
        opacity="0.3"
        vector-effect="non-scaling-stroke"
      />
      <path
        d={path}
        fill="none"
        stroke={accentDeep}
        stroke-width="1.6"
        stroke-dasharray="4 5"
        stroke-linecap="round"
        opacity="0.6"
        vector-effect="non-scaling-stroke"
      />
    </svg>

    <span
      class="marker"
      style:left="{markerLeft}%"
      style:top="{markerTop}px"
      aria-hidden="true"
    >
      <svg viewBox="-8 -8 16 16" width="16" height="16">
        <circle r="3.6" fill={accentDeep} />
        {#if isDay}
          {#each RAYS as r (r.x1 + ',' + r.y1)}
            <line
              x1={r.x1}
              y1={r.y1}
              x2={r.x2}
              y2={r.y2}
              stroke={accentDeep}
              stroke-width="1.4"
              stroke-linecap="round"
            />
          {/each}
        {:else}
          <!-- Bite out of the disc → crescent moon (paper-white cutout). -->
          <circle cx="1.6" cy="-1.1" r="3" fill="#ffffff" />
        {/if}
      </svg>
    </span>
  </div>

  <div class="times">
    <span class="t">
      <WeatherIcon
        name="sunrise"
        size={16}
        secondary={accent}
        primary={accentDeep}
      />
      {formatTime(sunrise, timezone, settings.hour12)}
    </span>
    <span class="t">
      <WeatherIcon
        name="sunset"
        size={16}
        secondary={accent}
        primary={accentDeep}
      />
      {formatTime(sunset, timezone, settings.hour12)}
    </span>
  </div>
</div>

<style>
  .sunarc {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .wave {
    position: relative;
  }
  .wave-svg {
    display: block;
    width: 100%;
    height: 54px;
  }
  .marker {
    position: absolute;
    display: block;
    width: 16px;
    height: 16px;
    margin: -8px 0 0 -8px; /* center on the computed point */
    transition:
      left 600ms ease,
      top 600ms ease;
  }
  .times {
    display: flex;
    justify-content: space-between;
    padding: 0 18px;
    font-size: clamp(10px, 3cqw, 12px);
    color: var(--paper-ink);
  }
  .t {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  @media (prefers-reduced-motion: reduce) {
    .marker {
      transition: none;
    }
  }
</style>
