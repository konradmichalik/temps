<script lang="ts">
  /**
   * The two bar primitives (docs/design/rules.md#visualisation-primitives):
   * `dot` marks a position on a scale (UV, air quality), `fill` shows a share
   * (rain chance). Colors come from `--accent-deep` and `--track`.
   */
  interface Props {
    /** Position or share, clamped to 0..1. */
    value: number;
    kind?: 'dot' | 'fill';
    /** Text alternative, e.g. "6 of 11". */
    label: string;
    /** Entrance delay in ms, after the tile has settled. */
    delay?: number;
  }

  let { value, kind = 'dot', label, delay = 0 }: Props = $props();

  const share = $derived(Math.min(Math.max(value, 0), 1));
</script>

<span class="meter" role="img" aria-label={label} style:--d="{delay}ms">
  {#if kind === 'fill'}
    <span class="fill" style:width="{share * 100}%"></span>
  {:else}
    <!-- Keeps the whole dot on the bar at 0 and at the top of the scale. -->
    <span
      class="dot"
      style:left="calc(var(--dot) / 2 + {share} * (100% - var(--dot)))"
    ></span>
  {/if}
</span>

<style>
  /* The margin makes room for the dot, which is taller than the bar, inside
     footers that clip their text. */
  .meter {
    --dot: 10px;
    position: relative;
    display: block;
    height: 4px;
    margin: 3px 0;
    border-radius: 2px;
    background: var(--track);
    flex: none;
  }
  .fill {
    position: absolute;
    inset: 0 auto 0 0;
    border-radius: 2px;
    background: var(--accent-deep);
  }
  .dot {
    position: absolute;
    top: 50%;
    width: var(--dot);
    height: var(--dot);
    box-sizing: border-box;
    border-radius: 50%;
    background: #ffffff;
    border: 2.5px solid var(--accent-deep);
    transform: translate(-50%, -50%);
  }

  @container card (min-width: 380px) {
    .meter {
      --dot: 12px;
      margin: 4px 0;
    }
    .dot {
      border-width: 3px;
    }
  }

  @keyframes grow {
    from {
      transform: scaleX(0);
    }
  }
  @keyframes slide {
    from {
      left: 0;
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: no-preference) {
    :global(.motion .in) .fill {
      transform-origin: left;
      animation: grow 900ms var(--ease-out) both;
      animation-delay: var(--d);
    }
    :global(.motion .in) .dot {
      animation: slide 1100ms var(--ease-out) both;
      animation-delay: var(--d);
    }
  }
</style>
