<script lang="ts">
  import type { WeatherData } from '../../services/open-meteo';
  import {
    heroIconColors,
    wmoToIcon,
    windDirectionIcon,
  } from '../../utils/wmo-icons';
  import {
    daysUntilFullMoon,
    moonIllumination,
    moonPhase,
    moonPhaseIcon,
    moonPhaseLabel,
  } from '../../services/moon-phase';
  import {
    feelsLike,
    pollutantLabel,
    pressureTrend,
    rainOutlook,
    uvLabel,
    uvPeak,
    windDirectionLabel,
  } from '../../services/metrics';
  import { formatTime } from '../../utils/time';
  import { settings } from '../../stores/settings.svelte';
  import WeatherIcon from '../ui/WeatherIcon.svelte';
  import SunArc from '../ui/SunArc.svelte';
  import Tile from '../ui/Tile.svelte';
  import Meter from '../ui/Meter.svelte';
  import RainBars from '../ui/RainBars.svelte';
  import Waves from '../effects/Waves.svelte';
  import { air } from '../../stores/air.svelte';
  import { aqiLabel, pollenLabel } from '../../services/air-quality';

  interface Props {
    data: WeatherData;
    accent: string;
    accentDeep?: string;
    active?: boolean;
    /** Ticks with the card clock, so trends and the sun stay current. */
    now?: Date;
  }

  let {
    data,
    accent,
    accentDeep = accent,
    active = true,
    now = new Date(),
  }: Props = $props();

  const c = $derived(data.current);
  const today = $derived(data.daily[0]);
  const locale = $derived(settings.locale);
  const de = $derived(locale === 'de');
  const time = (d: Date) => formatTime(d, data.timezone, settings.hour12);

  const feels = $derived(feelsLike(c.temperature, c.apparentTemperature));
  const trend = $derived(pressureTrend(c.pressure, data.hourly, now));
  const peak = $derived(uvPeak(data.hourly, now, data.timezone));
  const rain = $derived(rainOutlook(data.hourly, now));
  const heroIcon = $derived(wmoToIcon(c.weatherCode, c.isDay));
  const heroColors = $derived(heroIconColors(heroIcon, c.isDay));
  const phase = $derived(moonPhase(now));
  const fullIn = $derived(daysUntilFullMoon(now));
  const pollen = $derived(air.data?.pollen ?? []);
  const showAir = $derived(settings.airQualityEnabled && air.data !== null);

  const TREND = {
    rising: { de: 'steigend', en: 'rising', path: 'M6 18L18 6M9 6h9v9' },
    falling: { de: 'fallend', en: 'falling', path: 'M6 6l12 12M18 9v9H9' },
    steady: {
      de: 'gleichbleibend',
      en: 'steady',
      path: 'M4 12h16M14 6l6 6-6 6',
    },
  } as const;

  const feelsLine = $derived(
    feels.delta === 0
      ? de
        ? 'Wie gemessen'
        : 'As measured'
      : `${Math.abs(feels.delta)}° ${
          feels.delta > 0
            ? de
              ? 'wärmer'
              : 'warmer'
            : de
              ? 'kälter'
              : 'colder'
        }`,
  );

  const moonLine = $derived(
    fullIn === 0
      ? de
        ? 'Vollmond'
        : 'Full moon'
      : fullIn <= 7
        ? de
          ? `Vollmond in ${fullIn} T.`
          : `Full moon in ${fullIn} d`
        : phase < 0.5
          ? de
            ? 'Zunehmend'
            : 'Waxing'
          : de
            ? 'Abnehmend'
            : 'Waning',
  );
</script>

<div class="color-zone" class:in={active}>
  <div class="compact">
    <span class="st" style:--d="0ms"
      ><span class="hero-float"
        ><WeatherIcon
          name={heroIcon}
          size="var(--hero-icon)"
          primary={heroColors.primary}
          secondary={heroColors.secondary}
        /></span
      ></span
    >
    <span class="temp st" style:--d="80ms">{Math.round(c.temperature)}°</span>
  </div>
  <Waves animated={settings.waveAnimation} />
</div>

<div
  class="paper-zone"
  class:in={active}
  style:--accent-deep={accentDeep}
  style:--track="{accent}4D"
>
  <ul class="grid" aria-label={de ? 'Wetterdetails' : 'Weather details'}>
    <Tile label="Wind" icon="wind" delay={160}>
      {#snippet value()}{Math.round(c.windSpeed)}<small>km/h</small>{/snippet}
      {#snippet glyph()}
        <WeatherIcon
          name={windDirectionIcon(c.windDirection)}
          size="var(--tile-glyph)"
          primary="var(--accent-deep)"
          secondary="var(--ink-muted)"
          label=""
        />
      {/snippet}
      {#snippet footer()}
        {de ? 'Aus' : 'From'}
        {windDirectionLabel(c.windDirection, locale)}
        {#if c.windGusts !== null}
          · {de ? 'Böen' : 'gusts'} {Math.round(c.windGusts)}
        {/if}
      {/snippet}
    </Tile>

    <Tile label={de ? 'Gefühlt' : 'Feels like'} icon={feels.icon} delay={220}>
      {#snippet value()}{Math.round(c.apparentTemperature)}°{/snippet}
      {#snippet footer()}{feelsLine}{/snippet}
    </Tile>

    <Tile
      label={de ? 'Luftfeuchte' : 'Humidity'}
      short={de ? 'Feuchte' : undefined}
      icon="humidity"
      delay={280}
    >
      {#snippet value()}{Math.round(c.humidity)}<small>%</small>{/snippet}
      {#snippet footer()}
        {#if c.dewPoint !== null}
          {de ? 'Taupunkt' : 'Dew point'}
          {Math.round(c.dewPoint)}°
        {/if}
      {/snippet}
    </Tile>

    {#if c.pressure !== null}
      {@const pressure = c.pressure}
      <Tile label={de ? 'Luftdruck' : 'Pressure'} icon="barometer" delay={340}>
        {#snippet value()}{Math.round(pressure)}<small>hPa</small>{/snippet}
        {#snippet footer()}
          {#if trend}
            <span class="trend">
              <svg viewBox="0 0 24 24" aria-hidden="true"
                ><path d={TREND[trend.trend].path} /></svg
              >
              {TREND[trend.trend][locale]}
            </span>
          {:else}
            {de ? 'Auf Meereshöhe' : 'At sea level'}
          {/if}
        {/snippet}
      </Tile>
    {/if}

    <Tile
      label={de ? 'Regen · nächste 12 h' : 'Rain · next 12 h'}
      icon="cloud-rain"
      wide
      only="wide"
      delay={400}
    >
      {#snippet aside()}
        {#if rain.start}
          {de ? 'ab' : 'from'} {time(rain.start)}
        {:else}
          {de ? 'Trocken' : 'Dry'}
        {/if}
      {/snippet}
      <RainBars
        hours={rain.hours}
        timezone={data.timezone}
        label={rain.start
          ? de
            ? `Regen wahrscheinlich ab ${time(rain.start)}`
            : `Rain likely from ${time(rain.start)}`
          : de
            ? 'In den nächsten 12 Stunden trocken'
            : 'Dry for the next 12 hours'}
      />
    </Tile>

    <Tile
      label={de ? 'Regen' : 'Rain'}
      icon="umbrella"
      only="narrow"
      delay={400}
    >
      {#snippet value()}{Math.round(today.precipitationProbabilityMax)}<small
          >%</small
        >{/snippet}
      {#snippet footer()}
        <Meter
          kind="fill"
          value={today.precipitationProbabilityMax / 100}
          label="{Math.round(today.precipitationProbabilityMax)} %"
          delay={700}
        />
      {/snippet}
    </Tile>

    <Tile label={de ? 'UV-Index' : 'UV index'} icon="sun" delay={460}>
      {#snippet value()}{Math.round(c.uvIndex)}<small class="band"
          >{uvLabel(c.uvIndex, locale)}</small
        >{/snippet}
      {#snippet footer()}
        <Meter
          value={c.uvIndex / 11}
          label={de
            ? `${Math.round(c.uvIndex)} von 11`
            : `${Math.round(c.uvIndex)} of 11`}
          delay={760}
        />
        {#if peak}<span class="wide-only"
            >{de ? 'Spitze um' : 'Peak at'} {time(peak.time)}</span
          >{/if}
      {/snippet}
    </Tile>

    {#if showAir && air.data?.aqi != null}
      <Tile
        label={de ? 'Luftqualität' : 'Air quality'}
        short={de ? 'Luft' : 'Air'}
        icon="cloud-smog"
        delay={520}
      >
        {#snippet value()}{Math.round(air.data!.aqi!)}<small class="band"
            >{aqiLabel(air.data!.aqi!, locale)}</small
          >{/snippet}
        {#snippet footer()}
          <Meter
            value={air.data!.aqi! / 100}
            label={de
              ? `Index ${Math.round(air.data!.aqi!)} von 100`
              : `Index ${Math.round(air.data!.aqi!)} of 100`}
            delay={820}
          />
          {#if air.data!.leading}<span class="wide-only"
              >{de ? 'Vor allem' : 'Mostly'}
              {pollutantLabel(air.data!.leading, locale)}</span
            >{/if}
        {/snippet}
      </Tile>
    {/if}

    {#if showAir && pollen.length > 0}
      <Tile label="Pollen" icon="pollen" delay={580}>
        {#snippet value()}<span class="species"
            >{pollenLabel(pollen[0].species, locale)}</span
          >{/snippet}
        {#snippet footer()}
          {#if pollen[1]}
            {de ? 'Auch' : 'Also'}
            {pollenLabel(pollen[1].species, locale)}
          {/if}
        {/snippet}
      </Tile>
    {/if}

    <Tile label={de ? 'Mond' : 'Moon'} icon="stars" delay={640}>
      {#snippet value()}{Math.round(moonIllumination(phase) * 100)}<small
          >%</small
        >{/snippet}
      {#snippet glyph()}
        <WeatherIcon
          name={moonPhaseIcon(now)}
          size="var(--tile-glyph)"
          primary="var(--accent-deep)"
          secondary="var(--ink-muted)"
          label={moonPhaseLabel(now, locale)}
        />
      {/snippet}
      {#snippet footer()}{moonLine}{/snippet}
    </Tile>

    <Tile label={de ? 'Sonne' : 'Sun'} wide delay={700}>
      {#snippet aside()}
        <WeatherIcon
          name="sunrise"
          size="var(--tile-icon)"
          primary="var(--accent-deep)"
          secondary="var(--ink-muted)"
          label={de ? 'Aufgang' : 'Sunrise'}
        />{time(today.sunrise)}
        <WeatherIcon
          name="sunset"
          size="var(--tile-icon)"
          primary="var(--accent-deep)"
          secondary="var(--ink-muted)"
          label={de ? 'Untergang' : 'Sunset'}
        />{time(today.sunset)}
      {/snippet}
      <SunArc
        sunrise={today.sunrise}
        sunset={today.sunset}
        timezone={data.timezone}
        {now}
        label={de ? 'Sonnenstand jetzt' : 'Sun position now'}
      />
    </Tile>
  </ul>
</div>

<style>
  /* Details uses a slim color band, not the shared 64% zone: the opaque
     paper-zone below covers the shared waves, giving the tile grid the whole
     card. The band gets its own waves at the color→white edge. */
  .color-zone {
    --hero-icon: 46px;
    position: relative;
    height: 30%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .compact {
    display: flex;
    align-items: center;
    gap: 12px;
    transform: translateY(-6px);
  }
  .temp {
    font-size: 52px;
    font-weight: 300;
    line-height: 1;
    color: var(--ink-strong);
  }
  .paper-zone {
    position: relative;
    z-index: 1;
    flex: 1;
    background: var(--paper);
    padding: 6px 12px 22px;
    overflow-y: auto;
  }
  .grid {
    list-style: none;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
  }
  .trend {
    display: flex;
    align-items: center;
    gap: 3px;
  }
  .trend svg {
    width: 10px;
    height: 10px;
    fill: none;
    stroke: var(--accent-deep);
    stroke-width: 2.6;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .species {
    font-size: 0.89em;
  }
  .wide-only {
    display: none;
  }

  @container card (min-width: 380px) {
    .color-zone {
      --hero-icon: 64px;
      height: min(30%, 200px);
    }
    .temp {
      font-size: 72px;
    }
    .paper-zone {
      padding: 12px 16px 24px;
    }
    .grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }
    .trend svg {
      width: 12px;
      height: 12px;
    }
    .wide-only {
      display: block;
    }
  }
</style>
