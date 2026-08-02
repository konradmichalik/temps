<script lang="ts">
  /**
   * The shared "hero" reading at the top of the color zone: the current
   * temperature as the centered anchor, the weather icon hanging off its
   * upper-left, and a rule + condition line centered under the number (not the
   * degree sign). Used identically on the Overview and Hourly screens so their
   * upper halves match; an optional nowcast bar shows only where passed in.
   */
  import type { CurrentWeather, RainSlot } from '../../services/open-meteo';
  import { wmoToIcon, wmoToLabel } from '../../utils/wmo-icons';
  import { settings } from '../../stores/settings.svelte';
  import WeatherIcon from './WeatherIcon.svelte';
  import NowcastBar from './NowcastBar.svelte';

  interface Props {
    current: CurrentWeather;
    /** Pass the 15-min slots to show the nowcast bar (Overview only). */
    nowcast?: RainSlot[];
    active?: boolean;
  }

  let { current, nowcast, active = true }: Props = $props();

  const feelsDiff = $derived(
    Math.abs(current.apparentTemperature - current.temperature) >= 3,
  );
</script>

<div class="color-zone" class:in={active}>
  <div class="hero">
    <div class="reading">
      <span class="temp-wrap st" style:--d="70ms">
        <span class="icon"
          ><WeatherIcon
            name={wmoToIcon(current.weatherCode, current.isDay)}
            size={62}
            primary="#ffffff"
            secondary="rgba(255,255,255,0.42)"
          /></span
        >
        <span class="temp"
          >{Math.round(current.temperature)}<span class="deg">°</span></span
        >
      </span>
      <span class="rule st" style:--d="150ms"></span>
      <span class="condition st" style:--d="200ms"
        >{wmoToLabel(current.weatherCode, settings.locale)}</span
      >
      {#if feelsDiff}
        <span class="feels st" style:--d="260ms"
          >{settings.locale === 'de' ? 'gefühlt' : 'feels like'}
          {Math.round(current.apparentTemperature)}°</span
        >
      {/if}
      {#if nowcast}
        <span class="st" style:--d="300ms">
          <NowcastBar slots={nowcast} />
        </span>
      {/if}
    </div>
  </div>
</div>

<style>
  .color-zone {
    height: var(--color-zone);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .hero {
    transform: translateY(6px);
  }
  .reading {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  /* The temperature *number* is the centered anchor: the degree sign is taken
     out of flow so the condition below lines up under the digits, and the
     icon hangs off the number's upper-left. */
  .temp-wrap {
    position: relative;
    align-self: center;
  }
  .temp-wrap .icon {
    position: absolute;
    right: 100%;
    top: 0;
    margin-right: 6px;
    transform: translateY(-14%);
    line-height: 0;
  }
  .temp {
    position: relative;
    display: block;
    font-size: clamp(56px, 18.8cqw, 86px);
    font-weight: 300;
    color: var(--ink-strong);
    line-height: 1;
  }
  .deg {
    position: absolute;
    left: 100%;
    top: 0;
  }
  .rule {
    width: 26px;
    height: 1px;
    background: var(--ink-faint);
    margin: 10px 0 8px;
  }
  .condition {
    font-size: clamp(13px, 4.4cqw, 18px);
    color: var(--ink-soft);
  }
  .feels {
    margin-top: 4px;
    font-size: 11px;
    color: var(--ink-faint);
  }
</style>
