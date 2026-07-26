/**
 * Rain-alert controller: owns the debounce state and fires the native
 * notification. The decision logic itself is the pure `analyzeRainAlert`
 * service; this store only wires it to settings and plugin-notification.
 */
import { isTauri } from '../utils/tauri';
import { analyzeRainAlert, type RainAlertState } from '../services/rain-alert';
import type { WeatherData } from '../services/open-meteo';
import { settings } from './settings.svelte';

class RainAlertController {
  #state: RainAlertState = { armed: false };

  /** Forget debounce state (e.g. after switching to a different city). */
  reset(): void {
    this.#state = { armed: false };
  }

  async check(data: WeatherData): Promise<void> {
    if (!isTauri() || !settings.rainAlertEnabled) return;
    if (data.minutely15.length === 0) return;

    const res = analyzeRainAlert(data.minutely15, new Date(), this.#state, {
      utcOffsetSeconds: data.utcOffsetSeconds,
      respectQuietHours: settings.rainAlertQuietHours,
    });
    this.#state = res.state;

    if (res.notify && res.minutesUntil !== null) {
      await this.#notify(data.place.name, res.minutesUntil);
    }
  }

  async #notify(city: string, minutes: number): Promise<void> {
    const body =
      settings.locale === 'de'
        ? `Regen beginnt in ~${minutes} min in ${city}`
        : `Rain starts in ~${minutes} min in ${city}`;
    try {
      const mod = await import('@tauri-apps/plugin-notification');
      let granted = await mod.isPermissionGranted();
      if (!granted) granted = (await mod.requestPermission()) === 'granted';
      if (granted) mod.sendNotification({ title: 'Temps', body });
    } catch (e) {
      console.error('rain notification failed:', e);
    }
  }
}

export const rainAlert = new RainAlertController();
