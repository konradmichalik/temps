<script lang="ts">
  /**
   * The wave silhouette at the color→white transition — signature element
   * of the original design (there it was a static image; here it lives).
   * Three overlaid layers, each with two combined motions:
   *   - horizontal drift: a seamless loop (the pattern repeats every 170
   *     viewBox units; shifting by exactly one period makes the wrap
   *     invisible — no ping-pong reversal)
   *   - vertical swell: a slow bob with per-layer phase offsets, so crests
   *     overlap and separate organically
   * Only transform is animated; `animated={false}` freezes it (setting),
   * prefers-reduced-motion kills it globally via app.css.
   */
  interface Props {
    animated?: boolean;
  }

  let { animated = true }: Props = $props();
</script>

<div class="waves" class:animated aria-hidden="true">
  <svg viewBox="0 0 680 64" preserveAspectRatio="none">
    <g class="drift back">
      <path
        class="swell"
        fill="rgba(255,255,255,0.30)"
        d="M0 34 Q 42 20 85 32 T 170 30 T 255 36 T 340 28 T 425 34 T 510 26 T 595 34 T 680 30 L 680 64 L 0 64 Z"
      />
    </g>
    <g class="drift mid">
      <path
        class="swell"
        fill="rgba(255,255,255,0.45)"
        d="M0 42 Q 42 30 85 40 T 170 38 T 255 44 T 340 36 T 425 42 T 510 38 T 595 44 T 680 40 L 680 64 L 0 64 Z"
      />
    </g>
    <g class="drift front">
      <path
        class="swell"
        fill="#ffffff"
        d="M0 52 Q 42 42 85 50 T 170 48 T 255 54 T 340 46 T 425 52 T 510 48 T 595 54 T 680 50 L 680 64 L 0 64 Z"
      />
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

  .drift,
  .swell {
    animation-play-state: paused;
  }
  .animated .drift,
  .animated .swell {
    animation-play-state: running;
  }

  /* Horizontal: one pattern period (170 of 680 units = 25% of the path
     bbox) per cycle — the loop restart is pixel-identical, hence seamless.
     Layers move at different speeds and the back layer in reverse for
     genuine overlap instead of a rigid parallax block. */
  .drift {
    animation: drift linear infinite;
    will-change: transform;
  }
  .back {
    animation-duration: 84s;
    animation-direction: reverse;
  }
  .mid {
    animation-duration: 58s;
  }
  .front {
    animation-duration: 38s;
  }
  @keyframes drift {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(-25%);
    }
  }

  /* Vertical: a slow swell, phase-shifted per layer via negative delays so
     crests meet and part. Amplitudes stay tiny (2-3 units) — breathing,
     not sloshing. */
  .swell {
    animation: swell ease-in-out infinite alternate;
    will-change: transform;
  }
  .back .swell {
    animation-duration: 7s;
    --amp: 2px;
  }
  .mid .swell {
    animation-duration: 9s;
    animation-delay: -3s;
    --amp: 2.5px;
  }
  .front .swell {
    animation-duration: 11s;
    animation-delay: -7s;
    --amp: 3px;
  }
  @keyframes swell {
    from {
      transform: translateY(0);
    }
    to {
      transform: translateY(var(--amp, 2px));
    }
  }
</style>
