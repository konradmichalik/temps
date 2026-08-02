<script lang="ts">
  /**
   * Settings overlay — like the original's third screen: color band with
   * waves on top, form below. City search lives here (as in 2016), plus
   * favorites, units, language, effects. No API key field anymore — that's
   * the point of the rebuild.
   *
   * Settings are grouped into tabs (Location / General / System) so the sheet
   * stays scannable. The city field is a keyboard-navigable autocomplete
   * (↑/↓ to move, ↵ to pick, Esc to clear). The whole overlay flies in and
   * back out via a Svelte transition, honoring prefers-reduced-motion.
   */
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import Waves from '../effects/Waves.svelte';
  import WeatherIcon from '../ui/WeatherIcon.svelte';
  import { searchPlaces, type Place } from '../../services/open-meteo';
  import { weather } from '../../stores/weather.svelte';
  import { settings } from '../../stores/settings.svelte';
  import { favorites } from '../../stores/favorites.svelte';
  import { update } from '../../stores/update.svelte';
  import { APP_VERSION } from '../../version';
  import { isTauri } from '../../utils/tauri';

  /** Native-shell settings (tray, autostart, notifications) only exist in the app. */
  const tauri = isTauri();

  interface Props {
    accent: string;
    accentDeep: string;
    /** Focus the city search on open (Cmd+F). */
    autofocus?: boolean;
    onclose: () => void;
  }

  let { accent, accentDeep, autofocus = false, onclose }: Props = $props();

  let searchInput = $state<HTMLInputElement>();

  const reduced =
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  const flyOpts = { y: 14, duration: reduced ? 0 : 260 };

  onMount(() => {
    if (autofocus) searchInput?.focus();
  });

  const de = $derived(settings.locale === 'de');

  type Tab = 'location' | 'general' | 'system';
  let tab = $state<Tab>('location');

  let query = $state('');
  let results = $state<Place[]>([]);
  let searching = $state(false);
  let activeResult = $state(0);
  let debounce: ReturnType<typeof setTimeout>;

  function onInput() {
    clearTimeout(debounce);
    activeResult = 0;
    if (query.trim().length < 2) {
      results = [];
      return;
    }
    debounce = setTimeout(async () => {
      searching = true;
      try {
        results = await searchPlaces(query, settings.locale);
        activeResult = 0;
      } catch {
        results = [];
      } finally {
        searching = false;
      }
    }, 300);
  }

  function onSearchKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (results.length) activeResult = (activeResult + 1) % results.length;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (results.length)
        activeResult = (activeResult - 1 + results.length) % results.length;
    } else if (e.key === 'Enter') {
      const r = results[activeResult];
      if (r) {
        e.preventDefault();
        pick(r);
      }
    } else if (e.key === 'Escape' && results.length) {
      e.preventDefault();
      results = [];
    }
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

<div
  class="overlay"
  role="dialog"
  aria-label="Settings"
  transition:fly={flyOpts}
>
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

  <div class="tabs" role="tablist" aria-label="Settings sections">
    <button
      role="tab"
      class="tab"
      class:active={tab === 'location'}
      aria-selected={tab === 'location'}
      onclick={() => (tab = 'location')}
    >
      {de ? 'Ort' : 'Location'}
    </button>
    <button
      role="tab"
      class="tab"
      class:active={tab === 'general'}
      aria-selected={tab === 'general'}
      onclick={() => (tab = 'general')}
    >
      {de ? 'Allgemein' : 'General'}
    </button>
    {#if tauri}
      <button
        role="tab"
        class="tab"
        class:active={tab === 'system'}
        aria-selected={tab === 'system'}
        onclick={() => (tab = 'system')}
      >
        System
      </button>
    {/if}
  </div>

  <div class="form">
    {#if tab === 'location'}
      <label class="field">
        <span class="caption">{de ? 'Stadt' : 'City'}</span>
        <input
          type="text"
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls="city-results"
          aria-activedescendant={results.length
            ? `city-result-${activeResult}`
            : undefined}
          aria-autocomplete="list"
          bind:this={searchInput}
          bind:value={query}
          oninput={onInput}
          onkeydown={onSearchKeydown}
          placeholder={weather.place.name +
            (weather.place.country ? `, ${weather.place.country}` : '')}
          autocomplete="off"
        />
      </label>

      {#if results.length > 0 || searching}
        <ul class="results" id="city-results" role="listbox">
          {#if searching}
            <li class="hint">…</li>
          {/if}
          {#each results as r, i (r.latitude + ',' + r.longitude)}
            <li role="presentation">
              <button
                id="city-result-{i}"
                role="option"
                aria-selected={i === activeResult}
                class="result"
                class:active={i === activeResult}
                onclick={() => pick(r)}
                onmousemove={() => (activeResult = i)}
              >
                {r.name}<span class="country">{r.country}</span>
              </button>
            </li>
          {/each}
        </ul>
      {/if}

      {#if favorites.list.length > 0}
        <div class="favorites">
          {#each favorites.list as f (f.latitude + ',' + f.longitude)}
            <button
              class="fav"
              style:color={accentDeep}
              onclick={() => pick(f)}
            >
              ★ {f.name}{f.country ? `, ${f.country}` : ''}
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
    {:else if tab === 'general'}
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
    {:else if tab === 'system'}
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

    <div class="bottom">
      {#if update.info}
        <a
          class="update"
          style:color={accentDeep}
          href={update.info.url}
          target="_blank"
          rel="noreferrer"
        >
          ↑ {de ? 'Update verfügbar' : 'Update available'}: v{update.info
            .version}
        </a>
      {/if}

      <footer>
        <span class="about">
          temps v{APP_VERSION} ·
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
</div>

<style>
  .overlay {
    position: absolute;
    inset: 0;
    z-index: 5;
    background: var(--paper);
    display: flex;
    flex-direction: column;
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

  .tabs {
    display: flex;
    gap: 2px;
    padding: 0 16px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }
  .tab {
    flex: 1;
    padding: 10px 4px;
    font-size: 12px;
    color: var(--paper-ink);
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition:
      color 160ms ease,
      border-color 160ms ease;
  }
  .tab.active {
    color: var(--paper-ink-strong);
    border-bottom-color: currentColor;
    font-weight: 500;
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
  .result:hover,
  .result.active {
    background: rgba(0, 0, 0, 0.06);
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

  .bottom {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .update {
    align-self: flex-start;
    font-size: 12px;
    font-weight: 500;
    padding: 4px 10px;
    border-radius: 99px;
    background: rgba(0, 0, 0, 0.05);
  }
  footer {
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
