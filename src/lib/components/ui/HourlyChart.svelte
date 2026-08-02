<script lang="ts">
  /**
   * The hourly temperature line — no chart library, per project rule.
   * One SVG path (Catmull-Rom → cubic Bézier), stroke-dashoffset reveal,
   * transparent pointer overlay drives a marker + tooltip that glide via
   * CSS transform transitions. Replaces the Chart.js interaction of the
   * original without per-frame canvas redraws.
   */
  import type { HourlyPoint } from '../../services/open-meteo';
  import { wmoToIcon } from '../../utils/wmo-icons';
  import { formatHourLabel } from '../../utils/time';
  import WeatherIcon from './WeatherIcon.svelte';

  interface Props {
    points: HourlyPoint[];
    timezone: string;
    color: string;
    /** Darker sibling of color; marker + tooltip highlight. */
    colorDeep?: string;
    locale?: string;
    unitSymbol?: string;
    /** Retriggers the line reveal each time the screen becomes active. */
    active?: boolean;
  }

  let {
    points,
    timezone,
    color,
    colorDeep = color,
    locale = 'en',
    unitSymbol = '°',
    active = true,
  }: Props = $props();

  const W = 300;
  const H = 110;
  // Full-bleed horizontally: the line runs edge to edge. Vertical padding keeps
  // crests/troughs (and the marker) off the clipping edges.
  const PAD_X = 0;
  const PAD_Y = 22;

  /** Rendered pixel width, used to clamp the tooltip inside the card. */
  let chartWidth = $state(0);
  /** Half the tooltip pill's footprint — keeps it fully visible at both ends. */
  const TOOLTIP_HALF = 50;

  const coords = $derived.by(() => {
    if (points.length < 2) return [];
    const temps = points.map((p) => p.temperature);
    const min = Math.min(...temps);
    const max = Math.max(...temps);
    const span = Math.max(max - min, 1);
    return points.map((p, i) => ({
      x: PAD_X + (i / (points.length - 1)) * (W - PAD_X * 2),
      y: PAD_Y + (1 - (p.temperature - min) / span) * (H - PAD_Y * 2),
      point: p,
    }));
  });

  /** Catmull-Rom spline converted to a cubic Bézier path. */
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

  let pathEl = $state<SVGPathElement | null>(null);
  let pathLength = $state(0);
  let revealed = $state(false);
  $effect(() => {
    if (pathEl && path && active) {
      pathLength = pathEl.getTotalLength();
      revealed = false;
      requestAnimationFrame(() =>
        requestAnimationFrame(() => (revealed = true)),
      );
    } else if (!active) {
      revealed = false;
    }
  });

  let activeIndex = $state<number | null>(null);
  const hovered = $derived(activeIndex !== null ? coords[activeIndex] : null);

  /** Tooltip center in px, clamped so it never spills past the card edges. */
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
  role="img"
  aria-label="Hourly temperature chart"
  bind:clientWidth={chartWidth}
  onpointermove={onPointerMove}
  onpointerleave={() => (activeIndex = null)}
>
  <svg viewBox="0 0 {W} {H}" preserveAspectRatio="none">
    <path
      bind:this={pathEl}
      d={path}
      fill="none"
      stroke={color}
      stroke-width="2"
      stroke-linecap="round"
      style:stroke-dasharray={pathLength || undefined}
      style:stroke-dashoffset={pathLength
        ? revealed
          ? 0
          : pathLength
        : undefined}
    />
    {#if hovered}
      <circle
        class="marker"
        r="4"
        fill={colorDeep}
        style:transform="translate({hovered.x}px, {hovered.y}px)"
      />
    {/if}
  </svg>

  {#if hovered}
    <div class="tooltip" style:left="{tooltipLeft}px">
      <WeatherIcon
        name={wmoToIcon(hovered.point.weatherCode, true)}
        size={16}
        secondary={color}
        primary={colorDeep}
      />
      <span class="temp" style:color={colorDeep}
        >{Math.round(hovered.point.temperature)}{unitSymbol}</span
      >
      <span class="when"
        >{formatHourLabel(hovered.point.time, timezone, locale)}</span
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
    height: 130px;
    overflow: visible;
  }
  path {
    transition: stroke-dashoffset 800ms ease-out;
  }
  .marker {
    transition: transform 120ms ease-out;
  }
  /* Single-line pill on its own white background so it never wraps near the
     edge and never clashes with the line it floats above. */
  .tooltip {
    position: absolute;
    top: -4px;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
    padding: 3px 9px;
    border-radius: 99px;
    background: var(--paper);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.14);
    transition: left 120ms ease-out;
    pointer-events: none;
  }
  .temp {
    font-size: 13px;
    font-weight: 600;
  }
  .when {
    font-size: 10px;
    color: var(--paper-ink);
  }
</style>
