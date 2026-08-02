<script lang="ts">
  import type { WeatherData } from '../../services/open-meteo';
  import { wmoToIcon, windDirectionIcon } from '../../utils/wmo-icons';
  import { moonPhaseIcon, moonPhaseLabel } from '../../services/moon-phase';
  import { settings } from '../../stores/settings.svelte';
  import WeatherIcon from '../ui/WeatherIcon.svelte';
  import SunArc from '../ui/SunArc.svelte';
  import Waves from '../effects/Waves.svelte';
  import { air } from '../../stores/air.svelte';
  import { aqiLabel, pollenLabel } from '../../services/air-quality';

  interface Props {
    data: WeatherData;
    accent: string;
    accentDeep?: string;
    active?: boolean;
  }

  let { data, accent, accentDeep = accent, active = true }: Props = $props();

  const c = $derived(data.current);
  const today = $derived(data.daily[0]);
  const de = $derived(settings.locale === 'de');

  function uvLabel(uv: number): string {
    if (uv >= 8) return de ? 'sehr hoch' : 'very high';
    if (uv >= 6) return de ? 'hoch' : 'high';
    if (uv >= 3) return de ? 'mäßig' : 'moderate';
    return de ? 'niedrig' : 'low';
  }

  const tiles = $derived([
    {
      icon: 'wind',
      value: `${Math.round(c.windSpeed)} km/h`,
      label: de ? 'Wind' : 'wind',
      extra: windDirectionIcon(c.windDirection),
    },
    {
      icon: 'thermometer-medium',
      value: `${Math.round(c.apparentTemperature)}°`,
      label: de ? 'gefühlt' : 'feels like',
    },
    {
      icon: 'humidity',
      value: `${Math.round(c.humidity)}%`,
      label: de ? 'Luftfeuchte' : 'humidity',
    },
    {
      icon: 'barometer',
      value: `${Math.round(c.pressure)} hPa`,
      label: de ? 'Luftdruck' : 'pressure',
    },
    {
      icon: 'umbrella',
      value: `${Math.round(today.precipitationProbabilityMax)}%`,
      label: de ? 'Regen' : 'rain chance',
    },
    {
      icon: 'sun-high',
      value: `${Math.round(c.uvIndex)} · ${uvLabel(c.uvIndex)}`,
      label: 'UV',
    },
    {
      icon: moonPhaseIcon(),
      value: moonPhaseLabel(new Date(), settings.locale),
      label: de ? 'Mond' : 'moon',
    },
  ]);

  // v1.1 tiles: only rendered when the endpoint has data for this place.
  const airTiles = $derived.by(() => {
    if (!settings.airQualityEnabled || !air.data) return [];
    const t: { icon: string; value: string; label: string; extra?: string }[] =
      [];
    if (air.data.aqi !== null) {
      t.push({
        icon: 'cloud-smog',
        value: `${Math.round(air.data.aqi)} · ${aqiLabel(air.data.aqi, settings.locale)}`,
        label: de ? 'Luftqualität' : 'air quality',
      });
    }
    const top = air.data.pollen.slice(0, 2);
    if (top.length > 0) {
      t.push({
        icon: 'pollen',
        value: top
          .map((x) => pollenLabel(x.species, settings.locale))
          .join(', '),
        label: de ? 'Pollen' : 'pollen',
      });
    }
    return t;
  });
</script>

<div class="color-zone" class:in={active}>
  <div class="compact">
    <span class="st" style:--d="0ms"
      ><WeatherIcon name={wmoToIcon(c.weatherCode, c.isDay)} size={40} /></span
    >
    <span class="temp st" style:--d="80ms">{Math.round(c.temperature)}°</span>
  </div>
  <Waves animated={settings.waveAnimation} />
</div>

<div class="paper-zone" class:in={active}>
  <ul class="grid">
    {#each [...tiles, ...airTiles] as t, i (t.label)}
      <li class="st" style:--d="{160 + i * 55}ms">
        <span class="ticon">
          <WeatherIcon
            name={t.icon}
            size={22}
            secondary={accent}
            primary={accentDeep}
          />
          {#if t.extra}
            <WeatherIcon
              name={t.extra}
              size={14}
              secondary={accent}
              primary={accentDeep}
            />
          {/if}
        </span>
        <span class="value">{t.value}</span>
        <span class="label">{t.label}</span>
      </li>
    {/each}
  </ul>
  <div class="st sunrow" style:--d="{160 + 9 * 55}ms">
    <SunArc
      sunrise={today.sunrise}
      sunset={today.sunset}
      timezone={data.timezone}
      {accent}
      {accentDeep}
    />
  </div>
</div>

<style>
  /* Details uses a slim color band (plan §7), not the shared 58% zone: the
     opaque paper-zone below covers the shared waves, giving the tile grid the
     whole card. The band gets its own waves at the color→white edge. */
  .color-zone {
    position: relative;
    height: 34%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .compact {
    display: flex;
    align-items: center;
    gap: 14px;
    transform: translateY(-6px);
  }
  .temp {
    font-size: clamp(40px, 13cqw, 60px);
    font-weight: 300;
    color: var(--ink-strong);
  }
  .paper-zone {
    position: relative;
    z-index: 1;
    flex: 1;
    background: var(--paper);
    padding: 12px 18px 18px;
    overflow-y: auto;
  }
  /* Break out of the paper-zone's horizontal padding so the sun wave spans the
     full card width. */
  .sunrow {
    margin: 12px -18px 0;
  }
  .grid {
    list-style: none;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px 6px;
  }
  li {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    text-align: center;
  }
  .ticon {
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }
  .value {
    font-size: clamp(11px, 3.6cqw, 15px);
    color: var(--paper-ink-strong);
    font-weight: 500;
  }
  .label {
    font-size: clamp(9px, 2.8cqw, 11px);
    color: var(--paper-ink);
    text-transform: lowercase;
  }
</style>
