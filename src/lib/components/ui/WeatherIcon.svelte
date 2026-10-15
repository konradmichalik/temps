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
    /** Pixels, or a CSS length such as `var(--tile-icon)` for layout-driven sizes. */
    size?: number | string;
    /** Highlight color. */
    primary?: string;
    /** Base color. */
    secondary?: string;
    /** Accessible name; an empty string marks the icon as decorative. */
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
  const length = $derived(typeof size === 'number' ? `${size}px` : size);
</script>

<span
  class="weather-multi-color wi wi-{name}"
  style:--weather-primary-fill={primary}
  style:--weather-secondary-fill={secondary}
  style:width={length}
  style:height={length}
>
  {#if symbol}
    <svg
      role={label === '' ? undefined : 'img'}
      aria-label={label === '' ? undefined : (label ?? name.replace(/-/g, ' '))}
      aria-hidden={label === '' ? 'true' : undefined}
      width="100%"
      height="100%"
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

  /* Multi-color mechanism: weather-sprite.ts wraps the parts, so the two
     tones follow the wrapper and the paths inherit their fill. */
  .weather-multi-color :global(.hl) {
    fill: var(--weather-primary-fill);
  }
  .weather-multi-color :global(.base) {
    fill: var(--weather-secondary-fill);
  }
</style>
