<script lang="ts">
  /**
   * Sun position over the full day/night cycle, spanning the whole width: a
   * wave around a horizon line. Daytime is the hump above the horizon (sunrise
   * → sunset), night the dip below; the marker rides the curve at the current
   * local time — the weather-iconic sun by day, the moon by night — so you can
   * read exactly where in the cycle you are. Sits in the 2×1 sun tile, whose
   * header carries the sunrise and sunset times.
   *
   * The wave stretches edge-to-edge via preserveAspectRatio="none"; the round
   * marker is a separate, undistorted overlay positioned on the same mapping.
   */
  import WeatherIcon from './WeatherIcon.svelte';

  interface Props {
    sunrise: Date;
    sunset: Date;
    timezone: string;
    now: Date;
    /** Text alternative describing where the sun is now. */
    label: string;
  }

  let { sunrise, sunset, timezone, now, label }: Props = $props();

  const W = 120; // viewBox width (stretched to full container width)
  const VB_H = 44; // viewBox height
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
  const nowF = $derived(dayFraction(now));
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

  // The window is centered on "now": screen fraction 0.5 always maps to the
  // current time, so the marker sits dead center and the cycle scrolls under it.
  function hAt(x01: number): number {
    const h = (nowF - 0.5 + x01) % 1;
    return h < 0 ? h + 1 : h;
  }

  const path = $derived.by(() => {
    const N = 96;
    let d = '';
    for (let i = 0; i <= N; i++) {
      const x01 = i / N;
      d += `${i === 0 ? 'M' : 'L'} ${(x01 * W).toFixed(1)} ${curveY(hAt(x01)).toFixed(1)}`;
    }
    return d;
  });

  // Marker: always horizontally centered (now); y as a share of the height so
  // it lands on the stretched curve at any tile size.
  const markerTop = $derived((curveY(nowF) / VB_H) * 100);

  // Where sunrise/sunset fall in the now-centered window (screen fraction).
  const posOf = (frac: number) => (((frac - nowF + 0.5) % 1) + 1) % 1;
  const sunriseX = $derived(posOf(srF) * 100);
  const sunsetX = $derived(posOf(ssF) * 100);
</script>

<div class="sunarc" role="img" aria-label={label}>
  <svg viewBox="0 0 {W} {VB_H}" preserveAspectRatio="none" aria-hidden="true">
    <line
      x1="0"
      y1={MID}
      x2={W}
      y2={MID}
      stroke="var(--track)"
      stroke-width="1.5"
      vector-effect="non-scaling-stroke"
    />
    <path
      d={path}
      fill="none"
      stroke="var(--accent-deep)"
      stroke-width="1.6"
      stroke-dasharray="3 4"
      stroke-linecap="round"
      vector-effect="non-scaling-stroke"
    />
  </svg>
  <span class="event" style:left="{sunriseX}%" aria-hidden="true"></span>
  <span class="event" style:left="{sunsetX}%" aria-hidden="true"></span>
  <span class="marker" style:top="{markerTop}%" aria-hidden="true">
    <span class="halo"></span>
    <WeatherIcon
      name={isDay ? 'sun' : 'moon'}
      size="var(--marker)"
      primary="var(--accent-deep)"
      secondary="var(--accent-deep)"
      label=""
    />
  </span>
</div>

<style>
  .sunarc {
    --marker: 18px;
    position: relative;
    height: 32px;
  }
  svg {
    display: block;
    width: 100%;
    height: 100%;
  }
  .event {
    position: absolute;
    top: 50%;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--accent-deep);
    transform: translate(-50%, -50%);
  }
  /* The tile surface behind the marker keeps the dashed curve from showing
     through the icon. */
  .marker {
    position: absolute;
    left: 50%;
    display: grid;
    place-items: center;
    width: calc(var(--marker) + 4px);
    height: calc(var(--marker) + 4px);
    border-radius: 50%;
    background: var(--tile);
    transform: translate(-50%, -50%);
  }
  .halo {
    position: absolute;
    inset: -2px;
    border-radius: 50%;
    border: 1.5px solid var(--accent-deep);
    opacity: 0.45;
  }
  .marker :global(.wi) {
    grid-area: 1 / 1;
  }

  @container card (min-width: 380px) {
    .sunarc {
      --marker: 22px;
      height: 46px;
    }
  }

  @keyframes halo {
    50% {
      opacity: 0.1;
    }
  }
  @media (prefers-reduced-motion: no-preference) {
    :global(.motion) .halo {
      animation: halo 2.4s ease-in-out infinite;
    }
  }
</style>
