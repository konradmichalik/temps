<script lang="ts">
  /**
   * Compact day chart for the forecast detail sheet: a smooth temperature line
   * (Catmull-Rom, no chart library) over faint hourly precipitation-probability
   * bars — the day's temperature trend and rain at a glance. Static (no tooltip).
   */
  import type { HourlyPoint } from '../../services/open-meteo';

  interface Props {
    points: HourlyPoint[];
    color: string;
    colorDeep?: string;
  }

  let { points, color, colorDeep = color }: Props = $props();

  const W = 300;
  const H = 64;
  const LINE_TOP = 6;
  const LINE_BOTTOM = 40;
  const RAIN_TOP = 46;
  const RAIN_BOTTOM = 62;

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
      const h =
        (Math.min(Math.max(p.precipitationProbability, 0), 100) / 100) *
        (RAIN_BOTTOM - RAIN_TOP);
      return { x: i * slot + slot * 0.2, w: slot * 0.6, y: RAIN_BOTTOM - h, h };
    });
  });
</script>

<svg
  class="daychart"
  viewBox="0 0 {W} {H}"
  preserveAspectRatio="none"
  role="img"
  aria-label="Temperature trend and hourly rain chance for the day"
>
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
  {#each bars as b (b.x)}
    {#if b.h > 0}
      <rect
        x={b.x}
        y={b.y}
        width={b.w}
        height={b.h}
        fill={color}
        opacity="0.3"
      />
    {/if}
  {/each}
  <path
    d={path}
    fill="none"
    stroke={colorDeep}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    vector-effect="non-scaling-stroke"
  />
</svg>

<style>
  .daychart {
    display: block;
    width: 100%;
    height: 54px;
  }
</style>
