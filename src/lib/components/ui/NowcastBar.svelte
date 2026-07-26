<script lang="ts">
  /**
   * 2-hour precipitation nowcast strip on the overview: 8 slots of 15 min,
   * wet slots filled, plus a short label ("rain in ~20 min"). Hidden when
   * nothing happens — silence is a feature.
   */
  import { analyzeNowcast, nowcastLabel } from '../../services/nowcast';
  import type { RainSlot } from '../../services/open-meteo';
  import { settings } from '../../stores/settings.svelte';

  interface Props {
    slots: RainSlot[];
  }

  let { slots }: Props = $props();

  const nowcast = $derived(analyzeNowcast(slots));
  const label = $derived(nowcastLabel(nowcast, settings.locale));
</script>

{#if label}
  <div class="nowcast">
    <span class="strip" aria-hidden="true">
      {#each nowcast.strip as wet, i (i)}
        <i class:wet></i>
      {/each}
    </span>
    <span class="label">{label}</span>
  </div>
{/if}

<style>
  .nowcast {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    margin-top: 10px;
  }
  .strip {
    display: flex;
    gap: 3px;
  }
  .strip i {
    width: 12px;
    height: 3px;
    border-radius: 2px;
    background: var(--ink-faint);
    opacity: 0.5;
  }
  .strip i.wet {
    background: var(--ink-strong);
    opacity: 0.95;
  }
  .label {
    font-size: clamp(10px, 3.2cqw, 12px);
    color: var(--ink-soft);
  }
</style>
