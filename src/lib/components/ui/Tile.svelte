<script lang="ts">
  /**
   * One detail tile: eyebrow (icon + label), value row (value + optional
   * glyph), footer (context line or a Meter). docs/design/rules.md#tile-anatomy
   * Colors come from `--accent-deep` and `--track` set by the screen.
   */
  import type { Snippet } from 'svelte';
  import WeatherIcon from './WeatherIcon.svelte';

  /** Icons drawn as one part: the whole glyph takes the accent on a tile. */
  const SINGLE_PART = ['sun', 'moon'];

  interface Props {
    label: string;
    /** Shorter label for the 3-column popover grid. */
    short?: string;
    icon?: string;
    /** Spans both columns: only for time series (rain per hour, the sun). */
    wide?: boolean;
    /** Show the tile only in the popover grid or only in the phone grid. */
    only?: 'narrow' | 'wide';
    /** Entrance delay in ms (shared `.st` stagger). */
    delay?: number;
    aside?: Snippet;
    value?: Snippet;
    glyph?: Snippet;
    footer?: Snippet;
    children?: Snippet;
  }

  let {
    label,
    short,
    icon,
    wide = false,
    only,
    delay = 0,
    aside,
    value,
    glyph,
    footer,
    children,
  }: Props = $props();
</script>

<li
  class="tile st"
  class:wide
  class:narrow-only={only === 'narrow'}
  class:wide-only={only === 'wide'}
  style:--d="{delay}ms"
>
  <span class="eyebrow">
    {#if icon}
      <WeatherIcon
        name={icon}
        size="var(--tile-icon)"
        primary="var(--accent-deep)"
        secondary={SINGLE_PART.includes(icon)
          ? 'var(--accent-deep)'
          : 'var(--ink-muted)'}
        label=""
      />
    {/if}
    {#if short}
      <span class="label narrow-only" aria-hidden="true">{short}</span>
      <span class="label wide-label">{label}</span>
    {:else}
      <span class="label">{label}</span>
    {/if}
    {#if aside}<span class="aside">{@render aside()}</span>{/if}
  </span>
  {#if value}
    <span class="value-row">
      <span class="value">{@render value()}</span>
      {#if glyph}<span class="glyph">{@render glyph()}</span>{/if}
    </span>
  {/if}
  {@render children?.()}
  {#if footer}<span class="footer">{@render footer()}</span>{/if}
</li>

<style>
  .tile {
    --tile-icon: 18px;
    --tile-glyph: 32px;
    height: 80px;
    box-sizing: border-box;
    padding: 7px 9px 8px;
    border-radius: 12px;
    background: var(--tile);
    color: var(--ink);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-width: 0;
  }
  .wide {
    grid-column: 1 / -1;
    height: 64px;
    padding-bottom: 6px;
  }
  .eyebrow {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 9px;
    font-weight: 500;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: var(--ink-muted);
    min-width: 0;
  }
  .label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .wide-only {
    display: none;
  }
  /* Popover shows the short label; the full one stays for screen readers. */
  .wide-label {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
  .aside {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    letter-spacing: 0;
    text-transform: none;
    color: var(--ink);
    font-variant-numeric: tabular-nums;
  }
  .value-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-width: 0;
  }
  .value {
    font-size: 18px;
    font-weight: 500;
    letter-spacing: -0.01em;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .value :global(small) {
    font-size: 10px;
    font-weight: 400;
    color: var(--ink-muted);
    margin-left: 0.15em;
  }
  /* A band word (high, okay) reads as a word, not a unit. */
  .value :global(small.band) {
    margin-left: 0.4em;
  }
  /* The glyph may overhang the row so it reads at a useful size. */
  .glyph {
    display: inline-flex;
    margin: calc((18px - var(--tile-glyph)) / 2) -5px
      calc((18px - var(--tile-glyph)) / 2) 0;
  }
  .footer {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 10px;
    color: var(--ink-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  @container card (min-width: 380px) {
    .tile {
      --tile-icon: 22px;
      --tile-glyph: 48px;
      height: 108px;
      padding: 11px 14px 12px;
      border-radius: 16px;
    }
    .wide {
      height: 96px;
      padding-bottom: 8px;
    }
    .eyebrow {
      font-size: 11px;
      gap: 6px;
    }
    .narrow-only {
      display: none;
    }
    .wide-only {
      display: flex;
    }
    .wide-label {
      position: static;
      width: auto;
      height: auto;
      clip-path: none;
    }
    .aside {
      font-size: 12px;
      gap: 5px;
    }
    .value {
      font-size: 28px;
    }
    .value :global(small) {
      font-size: 13px;
    }
    .glyph {
      margin: calc((28px - var(--tile-glyph)) / 2) -8px
        calc((28px - var(--tile-glyph)) / 2) 0;
    }
    .footer {
      font-size: 12px;
    }
  }
</style>
