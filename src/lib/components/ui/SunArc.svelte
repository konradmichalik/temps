<script lang="ts">
  /**
   * Sun position between sunrise and sunset as a small arc — the playful
   * sibling of two plain time tiles. At night the dot rests at the horizon.
   */
  import { formatTime } from '../../utils/time';
  import { settings } from '../../stores/settings.svelte';

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

  // Semicircle from (10,34) to (110,34), radius 50.
  const angle = $derived(Math.PI * (1 - progress));
  const dotX = $derived(60 + 50 * Math.cos(angle));
  const dotY = $derived(34 - 26 * Math.sin(angle));
</script>

<div class="sunarc">
  <svg viewBox="0 0 120 40" aria-hidden="true">
    <path
      d="M 10 34 Q 60 -18 110 34"
      fill="none"
      stroke={accent}
      stroke-width="1.5"
      stroke-dasharray="3 4"
      stroke-linecap="round"
      opacity="0.55"
    />
    <circle cx={dotX} cy={dotY} r="4" fill={accentDeep} />
  </svg>
  <div class="times">
    <span>{formatTime(sunrise, timezone, settings.hour12)}</span>
    <span>{formatTime(sunset, timezone, settings.hour12)}</span>
  </div>
</div>

<style>
  .sunarc {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 2px 6px;
  }
  svg {
    width: 100%;
    height: 40px;
  }
  circle {
    transition:
      cx 600ms ease,
      cy 600ms ease;
  }
  .times {
    display: flex;
    justify-content: space-between;
    font-size: clamp(10px, 3cqw, 12px);
    color: var(--paper-ink);
  }
</style>
