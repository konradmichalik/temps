<script lang="ts">
  /**
   * Sun position between sunrise and sunset: a dashed arc with a little rayed
   * sun riding it, flanked by sunrise/sunset icons + times. At night the sun
   * rests at the horizon.
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

  const progress = $derived.by(() => {
    const now = Date.now();
    const a = sunrise.getTime();
    const b = sunset.getTime();
    return Math.min(Math.max((now - a) / (b - a), 0), 1);
  });

  // Sun rides the exact quadratic Bézier of the arc so it never drifts off the
  // dashed path. Arc: P0(10,32) → control(60,-16) → P2(110,32); t = progress.
  const dot = $derived.by(() => {
    const t = progress;
    const mt = 1 - t;
    return {
      x: mt * mt * 10 + 2 * mt * t * 60 + t * t * 110,
      y: mt * mt * 32 + 2 * mt * t * -16 + t * t * 32,
    };
  });

  // Eight short rays around the sun body (static geometry, colored at runtime).
  const RAYS = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4;
    return {
      x1: Math.cos(a) * 4.4,
      y1: Math.sin(a) * 4.4,
      x2: Math.cos(a) * 6.4,
      y2: Math.sin(a) * 6.4,
    };
  });
</script>

<div class="sunarc">
  <svg viewBox="0 0 120 40" aria-hidden="true">
    <path
      d="M 10 32 Q 60 -16 110 32"
      fill="none"
      stroke={accent}
      stroke-width="1.5"
      stroke-dasharray="3 4"
      stroke-linecap="round"
      opacity="0.55"
    />
    <g class="sun" style:transform="translate({dot.x}px, {dot.y}px)">
      <circle r="3.1" fill={accentDeep} />
      {#each RAYS as r (r.x1 + ',' + r.y1)}
        <line
          x1={r.x1}
          y1={r.y1}
          x2={r.x2}
          y2={r.y2}
          stroke={accentDeep}
          stroke-width="1.2"
          stroke-linecap="round"
        />
      {/each}
    </g>
  </svg>
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
    padding: 2px 6px;
  }
  svg {
    width: 100%;
    height: 40px;
  }
  .sun {
    transition: transform 600ms ease;
  }
  .times {
    display: flex;
    justify-content: space-between;
    font-size: clamp(10px, 3cqw, 12px);
    color: var(--paper-ink);
  }
  .t {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  @media (prefers-reduced-motion: reduce) {
    .sun {
      transition: none;
    }
  }
</style>
