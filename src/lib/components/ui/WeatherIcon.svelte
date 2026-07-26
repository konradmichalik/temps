<script lang="ts">
  /**
   * Renders a weather-iconic symbol with multi-color support. The symbol markup
   * is inlined into the light DOM (not `<use>`) so the per-path fill rules below
   * actually apply — see utils/weather-sprite.ts. Custom properties drive the
   * two tones: primary = highlight (lightning, sun rays, mercury), secondary =
   * base (clouds, bodies, single-element icons).
   */
  import { weatherSymbol } from '../../utils/weather-sprite';

  interface Props {
    name: string;
    size?: number;
    /** Highlight color. */
    primary?: string;
    /** Base color. */
    secondary?: string;
    label?: string;
  }

  let {
    name,
    size = 32,
    primary = 'rgba(255,255,255,0.75)',
    secondary = '#ffffff',
    label,
  }: Props = $props();

  const symbol = $derived(weatherSymbol(name));
</script>

<span
  class="weather-multi-color"
  style:--weather-primary-fill={primary}
  style:--weather-secondary-fill={secondary}
  style:width="{size}px"
  style:height="{size}px"
>
  {#if symbol}
    <svg
      role="img"
      aria-label={label ?? name.replace(/-/g, ' ')}
      width={size}
      height={size}
      viewBox={symbol.viewBox}
    >
      <!-- eslint-disable-next-line svelte/no-at-html-tags -- static, trusted sprite markup -->
      {@html symbol.inner}
    </svg>
  {/if}
</span>

<style>
  span {
    display: inline-flex;
    line-height: 0;
  }

  /* Multi-color mechanism (mirrors weather-iconic-enhanced.css).
     Selector order matters: only-child rules must win over first-child. */
  .weather-multi-color :global(svg path:first-child),
  .weather-multi-color :global(svg g:first-child path) {
    fill: var(--weather-primary-fill);
  }
  .weather-multi-color :global(svg path:nth-child(2)),
  .weather-multi-color :global(svg g:nth-child(2) path) {
    fill: var(--weather-secondary-fill);
  }
  .weather-multi-color :global(svg path:only-child),
  .weather-multi-color :global(svg g:only-child path) {
    fill: var(--weather-secondary-fill);
  }
</style>
