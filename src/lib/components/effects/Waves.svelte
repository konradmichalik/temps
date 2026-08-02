<script lang="ts">
  /**
   * The wave silhouette at the color→white transition — signature element of
   * the original design (there a static image; here it lives). Three overlaid
   * layers, each combining two motions:
   *   - horizontal drift: a seamless loop (the pattern repeats every 170
   *     viewBox units; shifting by one period makes the wrap invisible)
   *   - shape morph: the crest heights actually change over time (SMIL animates
   *     the path `d`), so the silhouette reshapes rather than just sliding —
   *     each layer morphs on its own beat so crests meet and part organically.
   * Only transform is CSS-animated; the morph is SMIL. prefers-reduced-motion
   * freezes the drift (app.css) and skips the morph (no <animate> rendered).
   */
  import { onMount } from 'svelte';

  interface Props {
    animated?: boolean;
  }

  let { animated = true }: Props = $props();

  let reduced = $state(false);
  onMount(() => {
    reduced =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  });

  const morph = $derived(animated && !reduced);

  // Three crest shapes per layer (same command structure so they interpolate).
  // The path fills from the wavy top line down to y=64. Amplitudes are kept
  // shallow and the baselines sit low in the 64-unit box, so the color→white
  // transition reads as a gentle, flat swell rather than tall rolling waves.
  const BACK = [
    'M0 49 Q 42 43 85 48 T 170 46.5 T 255 49.5 T 340 46 T 425 49 T 510 46.5 T 595 49.5 T 680 47.5 L 680 64 L 0 64 Z',
    'M0 47.5 Q 42 46.5 85 45.5 T 170 48.5 T 255 46.5 T 340 49 T 425 46 T 510 49 T 595 47 T 680 49 L 680 64 L 0 64 Z',
    'M0 49.5 Q 42 45 85 49 T 170 46 T 255 49 T 340 46.5 T 425 49.5 T 510 45.5 T 595 48.5 T 680 46.5 L 680 64 L 0 64 Z',
  ];
  const MID = [
    'M0 53 Q 42 48 85 52 T 170 50.5 T 255 53.5 T 340 50 T 425 53 T 510 50.5 T 595 53.5 T 680 51.5 L 680 64 L 0 64 Z',
    'M0 51.5 Q 42 50.5 85 49.5 T 170 52.5 T 255 50.5 T 340 53 T 425 50 T 510 53 T 595 51 T 680 53 L 680 64 L 0 64 Z',
    'M0 53.5 Q 42 49 85 53 T 170 50 T 255 53 T 340 50.5 T 425 53.5 T 510 49.5 T 595 52.5 T 680 50.5 L 680 64 L 0 64 Z',
  ];
  const FRONT = [
    'M0 58 Q 42 53 85 57 T 170 55.5 T 255 58.5 T 340 55 T 425 58 T 510 55.5 T 595 58.5 T 680 56.5 L 680 64 L 0 64 Z',
    'M0 56.5 Q 42 55.5 85 54.5 T 170 57.5 T 255 55.5 T 340 58 T 425 55 T 510 58 T 595 56 T 680 58 L 680 64 L 0 64 Z',
    'M0 58.5 Q 42 54 85 58 T 170 55 T 255 58 T 340 55.5 T 425 58.5 T 510 54.5 T 595 57.5 T 680 55.5 L 680 64 L 0 64 Z',
  ];

  const values = (s: string[]) => `${s[0]};${s[1]};${s[2]};${s[0]}`;
  const SPLINE = '0.45 0 0.55 1';
  const keySplines = [SPLINE, SPLINE, SPLINE].join(';');
</script>

<div class="waves" class:animated aria-hidden="true">
  <svg viewBox="0 0 680 64" preserveAspectRatio="none">
    <g class="drift back">
      <path fill="rgba(255,255,255,0.30)" d={BACK[0]}>
        {#if morph}
          <animate
            attributeName="d"
            dur="11s"
            repeatCount="indefinite"
            calcMode="spline"
            keyTimes="0;0.34;0.67;1"
            {keySplines}
            values={values(BACK)}
          />
        {/if}
      </path>
    </g>
    <g class="drift mid">
      <path fill="rgba(255,255,255,0.45)" d={MID[0]}>
        {#if morph}
          <animate
            attributeName="d"
            dur="9s"
            repeatCount="indefinite"
            calcMode="spline"
            keyTimes="0;0.34;0.67;1"
            {keySplines}
            values={values(MID)}
          />
        {/if}
      </path>
    </g>
    <g class="drift front">
      <path fill="#ffffff" d={FRONT[0]}>
        {#if morph}
          <animate
            attributeName="d"
            dur="7s"
            repeatCount="indefinite"
            calcMode="spline"
            keyTimes="0;0.34;0.67;1"
            {keySplines}
            values={values(FRONT)}
          />
        {/if}
      </path>
    </g>
  </svg>
</div>

<style>
  .waves {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: var(--wave-height);
    pointer-events: none;
  }
  svg {
    display: block;
    width: 200%;
    height: 100%;
  }

  .drift {
    animation-play-state: paused;
  }
  .animated .drift {
    animation-play-state: running;
  }

  /* Horizontal: one pattern period (170 of 680 units = 25% of the path bbox)
     per cycle — the loop restart is pixel-identical, hence seamless. Layers
     move at different speeds, the back one reversed, for genuine overlap. */
  .drift {
    animation: drift linear infinite;
    will-change: transform;
  }
  .back {
    animation-duration: 50s;
    animation-direction: reverse;
  }
  .mid {
    animation-duration: 34s;
  }
  .front {
    animation-duration: 22s;
  }
  @keyframes drift {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(-25%);
    }
  }
</style>
