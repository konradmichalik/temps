<script lang="ts">
  /**
   * Three screens via CSS scroll-snap — no carousel library, per project
   * rule. Trackpad swiping is native; Cmd+D and arrow keys cycle screens
   * (backwards compatible with the original shortcut). Active index via
   * IntersectionObserver.
   */
  import type { Snippet } from 'svelte';

  interface Props {
    screens: Snippet<[boolean]>[];
    /** Dot color on the currently visible zone. */
    dotColor?: string;
    /** Index of the currently visible screen (bindable). */
    activeIndex?: number;
  }

  let {
    screens,
    dotColor = 'rgba(255,255,255,0.9)',
    activeIndex = $bindable(0),
  }: Props = $props();

  let container = $state<HTMLElement | null>(null);

  $effect(() => {
    if (!container) return;
    const sections = [...container.querySelectorAll('section')];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting)
            activeIndex = sections.indexOf(e.target as HTMLElement);
        }
      },
      { root: container, threshold: 0.6 },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  });

  export function goTo(index: number) {
    const clamped =
      ((index % screens.length) + screens.length) % screens.length;
    container
      ?.querySelectorAll('section')
      [clamped]?.scrollIntoView({ behavior: 'smooth', inline: 'start' });
  }

  export function cycle(delta = 1) {
    goTo(activeIndex + delta);
  }

  function onKeydown(e: KeyboardEvent) {
    const t = e.target as HTMLElement | null;
    if (
      t &&
      (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)
    )
      return;
    if (e.key === 'ArrowRight') cycle(1);
    else if (e.key === 'ArrowLeft') cycle(-1);
    else if (e.key === 'd' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      cycle(1);
    }
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div class="carousel" bind:this={container}>
  {#each screens as screen, i (i)}
    <section>{@render screen(i === activeIndex)}</section>
  {/each}
</div>

<nav class="dots" aria-label="Screens">
  {#each screens, i}
    <button
      class:active={i === activeIndex}
      style:--dot={dotColor}
      aria-label="Screen {i + 1}"
      aria-current={i === activeIndex}
      onclick={() => goTo(i)}
    ></button>
  {/each}
</nav>

<style>
  .carousel {
    position: absolute;
    inset: 0;
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
  }
  .carousel::-webkit-scrollbar {
    display: none;
  }
  /* Each screen paints only inside its own slide: charts with
     `overflow: visible` and the double-width waves would otherwise show at the
     edge of the neighbouring screen. */
  section {
    position: relative;
    flex: 0 0 100%;
    overflow: clip;
    scroll-snap-align: start;
    scroll-snap-stop: always;
    display: flex;
    flex-direction: column;
  }
  .dots {
    position: absolute;
    bottom: calc(8px + var(--safe-bottom, 0px));
    left: 0;
    right: 0;
    /* Above the Details paper-zone (z-index:1), which otherwise covers them. */
    z-index: 4;
    display: flex;
    justify-content: center;
    gap: 6px;
  }
  .dots button {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--dot);
    opacity: 0.35;
    transition:
      opacity 200ms ease,
      transform 200ms ease;
  }
  .dots button.active {
    opacity: 1;
    transform: scale(1.15);
  }
  .dots button:focus-visible {
    outline: 2px solid var(--dot);
    outline-offset: 2px;
  }
</style>
