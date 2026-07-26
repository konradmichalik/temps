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
  // The path fills from the wavy top line down to y=64.
  const BACK = [
    'M0 34 Q 42 22 85 32 T 170 29 T 255 35 T 340 28 T 425 34 T 510 29 T 595 35 T 680 31 L 680 64 L 0 64 Z',
    'M0 31 Q 42 29 85 27 T 170 33 T 255 29 T 340 34 T 425 28 T 510 34 T 595 30 T 680 34 L 680 64 L 0 64 Z',
    'M0 35 Q 42 26 85 34 T 170 28 T 255 34 T 340 29 T 425 35 T 510 27 T 595 33 T 680 29 L 680 64 L 0 64 Z',
  ];
  const MID = [
    'M0 42 Q 42 32 85 40 T 170 37 T 255 43 T 340 36 T 425 42 T 510 37 T 595 43 T 680 39 L 680 64 L 0 64 Z',
    'M0 39 Q 42 37 85 35 T 170 41 T 255 37 T 340 42 T 425 36 T 510 42 T 595 38 T 680 42 L 680 64 L 0 64 Z',
    'M0 43 Q 42 34 85 42 T 170 36 T 255 42 T 340 37 T 425 43 T 510 35 T 595 41 T 680 37 L 680 64 L 0 64 Z',
  ];
  const FRONT = [
    'M0 52 Q 42 42 85 50 T 170 47 T 255 53 T 340 46 T 425 52 T 510 47 T 595 53 T 680 49 L 680 64 L 0 64 Z',
    'M0 49 Q 42 47 85 45 T 170 51 T 255 47 T 340 52 T 425 46 T 510 52 T 595 48 T 680 52 L 680 64 L 0 64 Z',
    'M0 53 Q 42 44 85 52 T 170 46 T 255 52 T 340 47 T 425 53 T 510 45 T 595 51 T 680 47 L 680 64 L 0 64 Z',
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
