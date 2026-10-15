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
  import { rainBarHeight } from '../../services/metrics';

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
  // Full-bleed horizontally: the line runs edge to edge. The temperature line
  // lives in the upper band; hourly rain-chance bars sit in the lower band.
  const LINE_TOP = 14;
  const LINE_BOTTOM = 68;
  const RAIN_TOP = 76;
  const RAIN_BOTTOM = 108;
  /** 2px on screen: the svg draws H units into 130px. */
  const MIN_BAR = (2 * H) / 130;

  /** Rendered pixel width, used to clamp the tooltip inside the card. */
  let chartWidth = $state(0);
  /** Measured tooltip width; its text varies by locale and hour format. */
  let tooltipWidth = $state(0);
  const TOOLTIP_MARGIN = 6;

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
      return {
        x: i * slot + slot * 0.08,
        w: slot * 0.84,
        y: RAIN_BOTTOM - h,
        h,
      };
    });
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
    const half = tooltipWidth / 2 + TOOLTIP_MARGIN;
    return Math.min(Math.max(px, half), chartWidth - half);
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
    {#each bars as b, i (b.x)}
      {#if b.h > 0}
        <rect
          x={b.x}
          y={b.y}
          width={b.w}
          height={b.h}
          fill={color}
          opacity={activeIndex === i ? 0.85 : 0.55}
        />
      {/if}
    {/each}
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
    <div
      class="tooltip"
      style:left="{tooltipLeft}px"
      bind:clientWidth={tooltipWidth}
    >
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
      <span class="rain"
        >☂ {Math.round(hovered.point.precipitationProbability)}%</span
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
  .when,
  .rain {
    font-size: 10px;
    color: var(--paper-ink);
  }
</style>
