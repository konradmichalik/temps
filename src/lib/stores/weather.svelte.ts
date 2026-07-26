import {
  fetchWeather,
  type Place,
  type WeatherData,
} from '../services/open-meteo';
import { demoWeather, type DemoScenario } from '../utils/demo-data';
import { backgroundColor, ERROR_COLOR } from '../utils/temp-color';
import { wmoToEffect, type Effect } from '../utils/wmo-icons';
import { settings } from './settings.svelte';

const DEFAULT_PLACE: Place = {
  name: 'Berlin',
  country: 'DE',
  latitude: 52.52,
  longitude: 13.405,
  timezone: 'Europe/Berlin',
};

class WeatherStore {
  data = $state<WeatherData | null>(null);
  place = $state<Place>(DEFAULT_PLACE);
  loading = $state(false);
  error = $state<string | null>(null);
  /** Active demo scenario (landing ?demo=... or offline fallback). */
  demo = $state<DemoScenario | null>(null);

  /** Per-place cache so switching favorites feels instant. */
  #cache = new Map<string, WeatherData>();

  bgColor = $derived.by(() => {
    if (this.error && !this.data) return ERROR_COLOR;
    if (!this.data) return ERROR_COLOR;
    return backgroundColor(
      this.data.current.temperature,
      settings.unit,
      this.data.current.isDay,
    );
  });

  effect = $derived.by<Effect>(() =>
    this.data ? wmoToEffect(this.data.current.weatherCode) : null,
  );

  async load(place: Place = this.place, force = false): Promise<void> {
    this.place = place;

    if (this.demo) {
      this.data = demoWeather(this.demo);
      return;
    }

    const key = `${place.latitude},${place.longitude},${settings.unit}`;
    const cached = this.#cache.get(key);
    if (cached && !force) {
      this.data = cached;
      if (Date.now() - cached.fetchedAt.getTime() < 5 * 60_000) return;
    }

    this.loading = true;
    this.error = null;
    try {
      const fresh = await fetchWeather(place, settings.unit);
      this.#cache.set(key, fresh);
      this.data = fresh;
    } catch (e) {
      this.error = e instanceof Error ? e.message : String(e);
      if (!this.data) {
        // Offline / blocked network: fall back to demo so the UI stays alive.
        this.demo = 'sunny';
        this.data = demoWeather('sunny');
      }
    } finally {
      this.loading = false;
    }
  }

  setDemo(scenario: DemoScenario | null): void {
    this.demo = scenario;
    if (scenario) {
      this.error = null;
      this.data = demoWeather(scenario);
      this.place = this.data.place;
    }
  }
}

export const weather = new WeatherStore();
