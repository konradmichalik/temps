<script lang="ts">
  /**
   * Settings overlay — like the original's third screen: color band with
   * waves on top, form below. City search lives here (as in 2016), plus
   * favorites, units, language, effects. No API key field anymore — that's
   * the point of the rebuild.
   */
  import Waves from '../effects/Waves.svelte';
  import WeatherIcon from '../ui/WeatherIcon.svelte';
  import { searchPlaces, type Place } from '../../services/open-meteo';
  import { weather } from '../../stores/weather.svelte';
  import { settings } from '../../stores/settings.svelte';
  import { favorites } from '../../stores/favorites.svelte';
  import { isTauri } from '../../utils/tauri';

  /** Native-shell settings (tray, autostart, notifications) only exist in the app. */
  const tauri = isTauri();

  interface Props {
    accent: string;
    accentDeep: string;
    onclose: () => void;
  }

  let { accent, accentDeep, onclose }: Props = $props();

  const de = $derived(settings.locale === 'de');

  let query = $state('');
  let results = $state<Place[]>([]);
  let searching = $state(false);
  let debounce: ReturnType<typeof setTimeout>;

  function onInput() {
    clearTimeout(debounce);
    if (query.trim().length < 2) {
      results = [];
      return;
    }
    debounce = setTimeout(async () => {
      searching = true;
      try {
        results = await searchPlaces(query, settings.locale);
      } catch {
        results = [];
      } finally {
        searching = false;
      }
    }, 300);
  }

  function pick(place: Place) {
    weather.demo = null;
    weather.load(place, true);
    query = '';
    results = [];
    onclose();
  }

  function change() {
    settings.persist();
  }

  function changeUnit() {
    settings.persist();
    weather.load(weather.place, true); // temperature_unit is a request param
  }
</script>

<div class="overlay" role="dialog" aria-label="Settings">
  <div class="band" style:background-color={accent}>
    <Waves animated={settings.waveAnimation} />
    <button class="close" aria-label="Close" onclick={onclose}>
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" />
      </svg>
    </button>
    <h1>temps</h1>
  </div>

  <div class="form">
    <label class="field">
      <span class="caption">{de ? 'Stadt' : 'City'}</span>
      <input
        type="text"
        bind:value={query}
        oninput={onInput}
        placeholder={weather.place.name +
          (weather.place.country ? `, ${weather.place.country}` : '')}
        autocomplete="off"
      />
    </label>

    {#if results.length > 0 || searching}
      <ul class="results">
        {#if searching}
          <li class="hint">…</li>
        {/if}
        {#each results as r (r.latitude + ',' + r.longitude)}
          <li>
            <button class="result" onclick={() => pick(r)}>
              {r.name}<span class="country">{r.country}</span>
            </button>
          </li>
        {/each}
      </ul>
    {/if}

    {#if favorites.list.length > 0}
      <div class="favorites">
        {#each favorites.list as f (f.latitude + ',' + f.longitude)}
          <button class="fav" style:color={accentDeep} onclick={() => pick(f)}>
            ★ {f.name}
          </button>
        {/each}
      </div>
    {/if}
    <button
      class="fav-toggle"
      style:color={accentDeep}
      disabled={!favorites.has(weather.place) && favorites.full}
      onclick={() => favorites.toggle(weather.place)}
    >
      {favorites.has(weather.place)
        ? de
          ? '★ Favorit entfernen'
          : '★ Remove favorite'
        : de
          ? '☆ Als Favorit speichern'
          : '☆ Save as favorite'}
    </button>

    <div class="row">
      <span>{de ? 'Temperaturskala' : 'Temperature scale'}</span>
      <span class="choices">
        <label
          ><input
            type="radio"
            bind:group={settings.unit}
            value="celsius"
            onchange={changeUnit}
          /> °C</label
        >
        <label
          ><input
            type="radio"
            bind:group={settings.unit}
            value="fahrenheit"
            onchange={changeUnit}
          /> °F</label
        >
      </span>
    </div>

    <div class="row">
      <span>{de ? 'Sprache' : 'Language'}</span>
      <span class="choices">
        <label
          ><input
            type="radio"
            bind:group={settings.locale}
            value="de"
            onchange={change}
          /> DE</label
        >
        <label
          ><input
            type="radio"
            bind:group={settings.locale}
            value="en"
            onchange={change}
          /> EN</label
        >
      </span>
    </div>

    <div class="row">
      <span>{de ? 'Zeitformat' : 'Time format'}</span>
      <span class="choices">
        <label
          ><input
            type="radio"
            bind:group={settings.hour12}
            value={false}
            onchange={change}
          /> 24h</label
        >
        <label
          ><input
            type="radio"
            bind:group={settings.hour12}
            value={true}
            onchange={change}
          /> 12h</label
        >
      </span>
    </div>

    <label class="row">
      <span>{de ? 'Wetter-Effekte' : 'Weather effects'}</span>
      <input
        type="checkbox"
        bind:checked={settings.effectsEnabled}
        onchange={change}
      />
    </label>

    <label class="row">
      <span>{de ? 'Wellen-Animation' : 'Wave animation'}</span>
      <input
        type="checkbox"
        bind:checked={settings.waveAnimation}
        onchange={change}
      />
    </label>

    <label class="row">
      <span>{de ? 'Luftqualität & Pollen' : 'Air quality & pollen'}</span>
      <input
        type="checkbox"
        bind:checked={settings.airQualityEnabled}
        onchange={change}
      />
    </label>

    {#if tauri}
      <div class="row">
        <span>{de ? 'Aktualisierung' : 'Refresh interval'}</span>
        <span class="choices">
          {#each [5, 15, 30, 60] as m (m)}
            <label
              ><input
                type="radio"
                bind:group={settings.pollingMinutes}
                value={m}
                onchange={change}
              />
              {m}m</label
            >
          {/each}
        </span>
      </div>

      <label class="row">
        <span
          >{de ? 'Temperatur in Menüleiste' : 'Temperature in menu bar'}</span
        >
        <input
          type="checkbox"
          bind:checked={settings.menubarTemp}
          onchange={change}
        />
      </label>

      <label class="row">
        <span>{de ? 'Farbindikator' : 'Color indicator'}</span>
        <input
          type="checkbox"
          bind:checked={settings.colorIndicator}
          onchange={change}
        />
      </label>

      <label class="row">
        <span>{de ? 'Regenwarnung' : 'Rain alert'}</span>
        <input
          type="checkbox"
          bind:checked={settings.rainAlertEnabled}
          onchange={change}
        />
      </label>

      {#if settings.rainAlertEnabled}
        <label class="row indent">
          <span>{de ? 'Nachtruhe (23–7 Uhr)' : 'Quiet hours (11pm–7am)'}</span>
          <input
            type="checkbox"
            bind:checked={settings.rainAlertQuietHours}
            onchange={change}
          />
        </label>
      {/if}

      <label class="row">
        <span>{de ? 'Bei Anmeldung starten' : 'Start at login'}</span>
        <input
          type="checkbox"
          bind:checked={settings.autostart}
          onchange={change}
        />
      </label>

      <label class="row">
        <span>{de ? 'Globaler Kurzbefehl (⌘⇧W)' : 'Global shortcut (⌘⇧W)'}</span
        >
        <input
          type="checkbox"
          bind:checked={settings.globalShortcutEnabled}
          onchange={change}
        />
      </label>
    {/if}

    <footer>
      <span class="about">
        temps v2.0.0-beta ·
        <a href="https://open-meteo.com" target="_blank" rel="noreferrer"
          >weather data by Open-Meteo.com</a
        >
        ·
        <a
          href="https://github.com/konradmichalik/weather-iconic"
          target="_blank"
          rel="noreferrer">weather-iconic</a
        >
      </span>
      <WeatherIcon
        name="rainbow"
        size={16}
        secondary={accent}
        primary={accentDeep}
      />
    </footer>
  </div>
</div>

<style>
  .overlay {
    position: absolute;
    inset: 0;
    z-index: 5;
    background: var(--paper);
    display: flex;
    flex-direction: column;
    animation: rise 260ms ease-out;
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(14px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .band {
    position: relative;
    flex: 0 0 26%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: var(--bg-transition);
  }
  .band h1 {
    font-size: clamp(24px, 8cqw, 32px);
    font-weight: 400;
    color: var(--ink-strong);
    letter-spacing: 0.5px;
  }
  .close {
    position: absolute;
    top: calc(12px + var(--safe-top, 0px));
    left: 14px;
    color: var(--ink-soft);
    padding: 4px;
  }
  .close svg {
    fill: none;
  }

  .form {
    flex: 1;
    padding: 16px 22px calc(16px + var(--safe-bottom, 0px));
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
  }
  .caption {
    font-size: 11px;
    color: var(--paper-ink);
    display: block;
    margin-bottom: 3px;
  }
  input[type='text'] {
    width: 100%;
    border: none;
    border-bottom: 1px solid rgba(0, 0, 0, 0.2);
    font: inherit;
    font-size: 15px;
    padding: 4px 0;
    color: var(--paper-ink-strong);
    background: transparent;
    outline: none;
  }
  input[type='text']:focus {
    border-bottom-color: rgba(0, 0, 0, 0.45);
  }

  .results {
    list-style: none;
    padding: 0;
    margin: -6px 0 0;
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 6px;
    overflow: hidden;
  }
  .result {
    display: block;
    width: 100%;
    text-align: left;
    padding: 8px 10px;
    font-size: 13px;
    color: var(--paper-ink-strong);
  }
  .result:hover {
    background: rgba(0, 0, 0, 0.04);
  }
  .country {
    margin-left: 6px;
    font-size: 11px;
    color: var(--paper-ink);
  }
  .hint {
    padding: 8px 10px;
    font-size: 12px;
    color: var(--paper-ink);
  }

  .favorites {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .fav {
    font-size: 12px;
    padding: 3px 9px;
    border-radius: 99px;
    background: rgba(0, 0, 0, 0.05);
  }
  .fav-toggle {
    align-self: flex-start;
    font-size: 12px;
  }
  .fav-toggle:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    color: var(--paper-ink-strong);
    padding: 2px 0;
  }
  .row.indent {
    padding-left: 14px;
    color: var(--paper-ink);
  }
  .choices {
    display: flex;
    gap: 12px;
    font-size: 13px;
  }
  .choices label {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  input[type='radio'],
  input[type='checkbox'] {
    accent-color: #80bbb2;
  }

  footer {
    margin-top: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .about {
    font-size: 10px;
    color: var(--paper-ink);
  }
  .about a {
    color: inherit;
  }
</style>
