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
  }

  let { screens, dotColor = 'rgba(255,255,255,0.9)' }: Props = $props();

  let container = $state<HTMLElement | null>(null);
  let active = $state(0);

  $effect(() => {
    if (!container) return;
    const sections = [...container.querySelectorAll('section')];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting)
            active = sections.indexOf(e.target as HTMLElement);
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
    goTo(active + delta);
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
    <section>{@render screen(i === active)}</section>
  {/each}
</div>

<nav class="dots" aria-label="Screens">
  {#each screens, i}
    <button
      class:active={i === active}
      style:--dot={dotColor}
      aria-label="Screen {i + 1}"
      aria-current={i === active}
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
  section {
    flex: 0 0 100%;
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
