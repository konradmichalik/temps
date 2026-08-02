import type { Unit } from '../utils/temp-color';
import { loadJson, loadJsonAsync, saveJsonAsync } from '../utils/storage';

interface Persisted {
  unit: Unit;
  locale: 'en' | 'de';
  hour12: boolean;
  effectsEnabled: boolean;
  waveAnimation: boolean;
  pollingMinutes: number;
  airQualityEnabled: boolean;
  /** Tray: show a temperature-colored indicator dot (macOS, opt-in). */
  colorIndicator: boolean;
  /** Fire a native notification when rain is starting soon (opt-in). */
  rainAlertEnabled: boolean;
  /** Silence rain alerts between 23:00 and 07:00 local time. */
  rainAlertQuietHours: boolean;
  /** Launch Temps at login. */
  autostart: boolean;
  /** Global toggle shortcut enabled (default Cmd+Shift+W, registered in Rust). */
  globalShortcutEnabled: boolean;
}

/** Locale + unit autodetect from the browser; persisted choices win. */
function detectDefaults(): Persisted {
  const lang = typeof navigator !== 'undefined' ? navigator.language : 'en';
  const isDe = lang.toLowerCase().startsWith('de');
  const region = lang.split('-')[1]?.toUpperCase();
  // Fahrenheit countries: US, Liberia, Myanmar, plus US territories' locales.
  const fahrenheit = ['US', 'LR', 'MM'].includes(region ?? '');
  return {
    unit: fahrenheit ? 'fahrenheit' : 'celsius',
    locale: isDe ? 'de' : 'en',
    hour12: fahrenheit,
    effectsEnabled: true,
    waveAnimation: true,
    pollingMinutes: 15,
    airQualityEnabled: true,
    colorIndicator: false,
    rainAlertEnabled: false,
    rainAlertQuietHours: true,
    autostart: false,
    globalShortcutEnabled: true,
  };
}

class SettingsStore {
  unit = $state<Unit>('celsius');
  locale = $state<'en' | 'de'>('en');
  hour12 = $state(false);
  effectsEnabled = $state(true);
  waveAnimation = $state(true);
  pollingMinutes = $state(15);
  airQualityEnabled = $state(true);
  colorIndicator = $state(false);
  rainAlertEnabled = $state(false);
  rainAlertQuietHours = $state(true);
  autostart = $state(false);
  globalShortcutEnabled = $state(true);

  constructor() {
    this.#apply({
      ...detectDefaults(),
      ...(loadJson<Partial<Persisted>>('settings') ?? {}),
    });
  }

  #apply(v: Persisted): void {
    this.unit = v.unit;
    this.locale = v.locale;
    this.hour12 = v.hour12;
    this.effectsEnabled = v.effectsEnabled;
    this.waveAnimation = v.waveAnimation;
    this.pollingMinutes = v.pollingMinutes;
    this.airQualityEnabled = v.airQualityEnabled;
    this.colorIndicator = v.colorIndicator;
    this.rainAlertEnabled = v.rainAlertEnabled;
    this.rainAlertQuietHours = v.rainAlertQuietHours;
    this.autostart = v.autostart;
    this.globalShortcutEnabled = v.globalShortcutEnabled;
  }

  #snapshot(): Persisted {
    return {
      unit: this.unit,
      locale: this.locale,
      hour12: this.hour12,
      effectsEnabled: this.effectsEnabled,
      waveAnimation: this.waveAnimation,
      pollingMinutes: this.pollingMinutes,
      airQualityEnabled: this.airQualityEnabled,
      colorIndicator: this.colorIndicator,
      rainAlertEnabled: this.rainAlertEnabled,
      rainAlertQuietHours: this.rainAlertQuietHours,
      autostart: this.autostart,
      globalShortcutEnabled: this.globalShortcutEnabled,
    };
  }

  /** Pull persisted settings from plugin-store (Tauri) over the seeded defaults. */
  async hydrate(): Promise<void> {
    const saved = await loadJsonAsync<Partial<Persisted>>('settings');
    if (saved)
      this.#apply({ ...detectDefaults(), ...this.#snapshot(), ...saved });
  }

  persist(): void {
    void saveJsonAsync('settings', this.#snapshot());
  }
}

export const settings = new SettingsStore();
