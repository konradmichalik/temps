<script lang="ts">
  /**
   * Ambient weather effects. Lives on a FIXED layer between the background
   * color and the scroll-snap slides, so rain keeps falling while the user
   * swipes — the effect never "tears" with a slide. Only transform/opacity
   * are animated; prefers-reduced-motion disables everything via app.css.
   */
  import type { Effect } from '../../utils/wmo-icons';
  import WeatherIcon from '../ui/WeatherIcon.svelte';

  interface Props {
    kind: Effect;
    enabled?: boolean;
    /** Night without precipitation: a few twinkling stars. */
    night?: boolean;
  }

  let { kind, enabled = true, night = false }: Props = $props();

  // Kept clear of the centered hero reading.
  const STARS = [
    { left: 9, top: 14, size: 20 },
    { left: 80, top: 10, size: 16 },
    { left: 86, top: 24, size: 22 },
  ];

  // Deterministic pseudo-random so SSR/demo screenshots are stable.
  function rng(seed: number) {
    return () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
  }

  const drops = buildParticles(48, 1);
  const flakes = buildParticles(36, 2);

  function buildParticles(count: number, seed: number) {
    const r = rng(seed);
    return Array.from({ length: count }, () => ({
      left: r() * 100,
      delay: r() * 4,
      duration: 0.7 + r() * 0.9,
      slowDuration: 5 + r() * 6,
      scale: 0.6 + r() * 0.8,
      opacity: 0.35 + r() * 0.5,
    }));
  }

  let flash = $state(false);
  $effect(() => {
    if (kind !== 'thunder' || !enabled) return;
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;
    const schedule = () => {
      timer = setTimeout(
        () => {
          if (cancelled) return;
          flash = true;
          setTimeout(() => (flash = false), 110);
          schedule();
        },
        6000 + Math.random() * 8000,
      );
    };
    schedule();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  });

  const showRain = $derived(enabled && (kind === 'rain' || kind === 'thunder'));
  const showSnow = $derived(enabled && kind === 'snow');
  const showStars = $derived(enabled && night && kind === null);
</script>

<div class="effects" aria-hidden="true">
  {#if showStars}
    {#each STARS as s, i (i)}
      <span
        class="star"
        style:left="{s.left}%"
        style:top="{s.top}%"
        style:animation-delay="{i * 0.9}s"
      >
        <WeatherIcon
          name="stars"
          size={s.size}
          primary="#f3d9a4"
          secondary="rgba(255,255,255,0.55)"
          label=""
        />
      </span>
    {/each}
  {/if}

  {#if showRain}
    <div class="rain">
      {#each drops as d, i (i)}
        <i
          style:left="{d.left}%"
          style:animation-delay="{d.delay}s"
          style:animation-duration="{d.duration}s"
          style:opacity={d.opacity}
          style:transform="scaleY({d.scale})"
        ></i>
      {/each}
    </div>
  {/if}

  {#if showSnow}
    <div class="snow">
      {#each flakes as f, i (i)}
        <i
          style:left="{f.left}%"
          style:animation-delay="{f.delay}s"
          style:animation-duration="{f.slowDuration}s"
          style:width="{3 + f.scale * 3}px"
          style:height="{3 + f.scale * 3}px"
          style:opacity={f.opacity}
        ></i>
      {/each}
    </div>
  {/if}

  <div class="thunder" class:flash></div>
</div>

<style>
  .effects {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    /* Fade the particles out before the color→white edge so rain/snow
       dissolves into the waves instead of hard-clipping in a straight line. */
    -webkit-mask-image: linear-gradient(to bottom, #000 78%, transparent 100%);
    mask-image: linear-gradient(to bottom, #000 78%, transparent 100%);
  }

  .rain i {
    position: absolute;
    top: -14%;
    width: 1px;
    height: 12%;
    background: linear-gradient(
      rgba(255, 255, 255, 0),
      rgba(255, 255, 255, 0.7)
    );
    animation: fall linear infinite;
    will-change: transform;
  }

  @keyframes fall {
    to {
      transform: translateY(950%);
    }
  }

  .snow i {
    position: absolute;
    top: -6%;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.9);
    animation: drift linear infinite;
    will-change: transform;
  }

  @keyframes drift {
    0% {
      transform: translate(0, 0);
    }
    25% {
      transform: translate(10px, 28vh);
    }
    50% {
      transform: translate(-6px, 55vh);
    }
    75% {
      transform: translate(8px, 82vh);
    }
    100% {
      transform: translate(0, 110vh);
    }
  }

  .star {
    position: absolute;
  }

  @keyframes twinkle {
    50% {
      opacity: 0.25;
    }
  }
  @media (prefers-reduced-motion: no-preference) {
    .star {
      animation: twinkle 3s ease-in-out infinite;
    }
  }

  .thunder {
    position: absolute;
    inset: 0;
    background: #fff;
    opacity: 0;
    transition: opacity 90ms ease-out;
  }
  .thunder.flash {
    opacity: 0.75;
  }
</style>
