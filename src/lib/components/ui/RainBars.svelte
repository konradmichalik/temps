<script lang="ts">
  /**
   * Rain chance per hour for the 2×1 rain tile: bar height is the chance,
   * hours that are likely wet (50 % and more) are drawn at full strength.
   */
  interface Props {
    hours: { time: Date; precipitationProbability: number }[];
    timezone: string;
    label: string;
  }

  let { hours, timezone, label }: Props = $props();

  const hourFormat = $derived(
    new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      hourCycle: 'h23',
      timeZone: timezone,
    }),
  );
  const hourOf = (d: Date) => hourFormat.format(d);
</script>

<div class="rain" role="img" aria-label={label}>
  {#each hours as h, i (h.time.getTime())}
    <span class="col">
      {#if h.precipitationProbability > 0}
        <span
          class="bar"
          class:likely={h.precipitationProbability >= 50}
          style:height="{Math.min(h.precipitationProbability, 100)}%"
          style:--i={i}
        ></span>
      {:else}
        <span></span>
      {/if}
      <span class="hour">{i % 3 === 0 ? hourOf(h.time) : ''}</span>
    </span>
  {/each}
</div>

<style>
  .rain {
    display: flex;
    gap: 6px;
    height: 54px;
  }
  .col {
    flex: 1;
    display: grid;
    grid-template-rows: 1fr 12px;
    align-items: end;
    min-width: 0;
  }
  /* A dry hour draws nothing; any chance stays at least 2px tall. */
  .bar {
    display: block;
    min-height: 2px;
    border-radius: 3px;
    background: var(--accent-deep);
    opacity: 0.45;
  }
  .likely {
    opacity: 1;
  }
  .hour {
    font-size: 10px;
    line-height: 12px;
    color: var(--ink-muted);
    font-variant-numeric: tabular-nums;
  }

  @keyframes grow {
    from {
      transform: scaleY(0);
    }
  }
  @media (prefers-reduced-motion: no-preference) {
    :global(.motion .in) .bar {
      transform-origin: bottom;
      animation: grow 700ms var(--ease-out) both;
      animation-delay: calc(var(--i) * 45ms + 600ms);
    }
  }
</style>
