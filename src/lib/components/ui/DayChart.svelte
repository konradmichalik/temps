<script lang="ts">
  /**
   * Compact day chart for the forecast detail sheet: a smooth temperature line
   * in ink (Catmull-Rom, no chart library) over hourly precipitation-probability
   * bars in the deep accent — the day's temperature trend and rain at a glance.
   * A pointer reveals a marker + tooltip (time · temp · rain), like the hourly
   * screen.
   */
  import type { HourlyPoint } from '../../services/open-meteo';
  import { formatTime } from '../../utils/time';
  import WeatherIcon from './WeatherIcon.svelte';
  import { rainBarHeight } from '../../services/metrics';

  interface Props {
    points: HourlyPoint[];
    timezone: string;
    color: string;
    colorDeep?: string;
    hour12?: boolean;
    unitSymbol?: string;
  }

  let {
    points,
    timezone,
    color,
    colorDeep = color,
    hour12 = false,
    unitSymbol = '°',
  }: Props = $props();

  const W = 300;
  const H = 64;
  const LINE_TOP = 6;
  const LINE_BOTTOM = 40;
  const RAIN_TOP = 46;
  const RAIN_BOTTOM = 62;
  /** 2px on screen: the svg draws H units into 54px. */
  const MIN_BAR = (2 * H) / 54;

  const coords = $derived.by(() => {
    if (points.length < 2) return [];
    const temps = points.map((p) => p.temperature);
    const min = Math.min(...temps);
    const max = Math.max(...temps);
    const span = Math.max(max - min, 1);
    return points.map((p, i) => ({
      x: (i / (points.length - 1)) * W,
      y:
        LINE_TOP +
        (1 - (p.temperature - min) / span) * (LINE_BOTTOM - LINE_TOP),
      point: p,
    }));
  });

  const path = $derived.by(() => {
    const c = coords;
    if (c.length < 2) return '';
    let d = `M ${c[0].x.toFixed(1)} ${c[0].y.toFixed(1)}`;
    for (let i = 0; i < c.length - 1; i++) {
      const p0 = c[Math.max(i - 1, 0)];
      const p1 = c[i];
      const p2 = c[i + 1];
      const p3 = c[Math.min(i + 2, c.length - 1)];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  });

  const bars = $derived.by(() => {
    const n = points.length;
    if (!n) return [];
    const slot = W / n;
    return points.map((p, i) => {
      const h = rainBarHeight(
        p.precipitationProbability,
        RAIN_BOTTOM - RAIN_TOP,
        MIN_BAR,
      );
      return { x: i * slot + slot * 0.2, w: slot * 0.6, y: RAIN_BOTTOM - h, h };
    });
  });

  let chartWidth = $state(0);
  const TOOLTIP_HALF = 46;
  let activeIndex = $state<number | null>(null);
  const hovered = $derived(activeIndex !== null ? coords[activeIndex] : null);

  const tooltipLeft = $derived.by(() => {
    if (!hovered || !chartWidth) return 0;
    const px = (hovered.x / W) * chartWidth;
    return Math.min(Math.max(px, TOOLTIP_HALF), chartWidth - TOOLTIP_HALF);
  });

  function onPointerMove(e: PointerEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < coords.length; i++) {
      const d = Math.abs(coords[i].x - x);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    activeIndex = best;
  }
</script>

<div
  class="chart"
  bind:clientWidth={chartWidth}
  onpointermove={onPointerMove}
  onpointerleave={() => (activeIndex = null)}
  role="img"
  aria-label="Temperature trend and hourly rain chance for the day"
>
  <svg viewBox="0 0 {W} {H}" preserveAspectRatio="none">
    <line
      x1="0"
      y1={RAIN_BOTTOM}
      x2={W}
      y2={RAIN_BOTTOM}
      stroke={color}
      stroke-width="1"
      opacity="0.18"
      vector-effect="non-scaling-stroke"
    />
    {#each bars as b, i (b.x)}
      {#if b.h > 0}
        <rect
          x={b.x}
          y={b.y}
          width={b.w}
          height={b.h}
          fill={colorDeep}
          opacity={activeIndex === i ? 0.85 : 0.55}
        />
      {/if}
    {/each}
    <path
      d={path}
      fill="none"
      stroke="var(--ink)"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      vector-effect="non-scaling-stroke"
    />
    {#if hovered}
      <circle
        class="marker"
        r="3"
        fill="var(--ink)"
        style:transform="translate({hovered.x}px, {hovered.y}px)"
      />
    {/if}
  </svg>

  {#if hovered}
    <div class="tooltip" style:left="{tooltipLeft}px">
      <span class="temp"
        >{Math.round(hovered.point.temperature)}{unitSymbol}</span
      >
      <span class="when"
        >{formatTime(hovered.point.time, timezone, hour12)}</span
      >
      <span class="rain"
        ><WeatherIcon
          name="umbrella"
          size={14}
          primary={colorDeep}
          secondary="var(--ink-muted)"
          label=""
        />{Math.round(hovered.point.precipitationProbability)}%</span
      >
    </div>
  {/if}
</div>

<style>
  .chart {
    position: relative;
    touch-action: none;
  }
  svg {
    display: block;
    width: 100%;
    height: 54px;
    overflow: visible;
  }
  .marker {
    transition: transform 100ms ease-out;
  }
  .tooltip {
    position: absolute;
    top: -16px;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
    padding: 2px 8px;
    border-radius: 99px;
    background: var(--paper);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.14);
    transition: left 100ms ease-out;
    pointer-events: none;
    font-size: 11px;
  }
  .temp {
    font-weight: 600;
    color: var(--ink);
  }
  .when,
  .rain {
    color: var(--ink-muted);
  }
  .rain {
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }
</style>
