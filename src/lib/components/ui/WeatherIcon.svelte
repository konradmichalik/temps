<script lang="ts">
  /**
   * Renders a weather-iconic sprite symbol with multi-color support.
   * The multi-color rules from weather-iconic-enhanced.css are inlined here
   * (the package's exports map doesn't expose that stylesheet), driven by
   * the same custom properties: primary = highlight (lightning, sun rays,
   * mercury), secondary = base (clouds, bodies, single-element icons).
   */
  import spritesUrl from 'weather-iconic/sprites';

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
</script>

<span
  class="weather-multi-color"
  style:--weather-primary-fill={primary}
  style:--weather-secondary-fill={secondary}
  style:width="{size}px"
  style:height="{size}px"
>
  <svg
    role="img"
    aria-label={label ?? name.replace(/-/g, ' ')}
    width={size}
    height={size}
    viewBox="0 0 32 32"
  >
    <use href="{spritesUrl}#weather-{name}" />
  </svg>
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
