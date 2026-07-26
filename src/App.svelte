<script lang="ts">
  /**
   * Dev harness / landing demo page: the AppCard at popover size with a
   * scenario switcher below. The standalone web app lives in app.html.
   */
  import { onMount } from 'svelte';
  import AppCard from './lib/components/layout/AppCard.svelte';
  import { weather } from './lib/stores/weather.svelte';
  import type { DemoScenario } from './lib/utils/demo-data';

  const SCENARIOS: DemoScenario[] = [
    'sunny',
    'rain',
    'snow',
    'thunder',
    'night',
  ];

  onMount(() => {
    const param = new URLSearchParams(location.search).get('demo');
    if (param && SCENARIOS.includes(param as DemoScenario)) {
      weather.setDemo(param as DemoScenario);
    } else {
      weather.load();
    }
  });
</script>

<main>
  <AppCard />

  <aside class="harness">
    {#each SCENARIOS as s (s)}
      <button class:on={weather.demo === s} onclick={() => weather.setDemo(s)}
        >{s}</button
      >
    {/each}
    <a href="/app.html">standalone →</a>
    {#if weather.error}
      <span class="offline">offline — demo data</span>
    {/if}
  </aside>
</main>

<style>
  main {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 18px;
    padding: 24px;
  }
  .harness {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
    justify-content: center;
  }
  .harness button {
    font-size: 12px;
    padding: 4px 10px;
    border-radius: 99px;
    background: rgba(0, 0, 0, 0.06);
    color: #555;
  }
  .harness button.on {
    background: #374151;
    color: #fff;
  }
  .harness a {
    font-size: 12px;
    color: #666;
  }
  .offline {
    font-size: 11px;
    color: #999;
  }
</style>
