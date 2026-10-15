/**
 * Open-Meteo delivers WMO weather interpretation codes (0-99).
 * Maps codes to weather-iconic icon names, human labels and ambient effects.
 */

export type Effect = 'rain' | 'snow' | 'thunder' | null;
export type Locale = 'en' | 'de';

interface WmoEntry {
  day: string;
  night: string;
  en: string;
  de: string;
  effect: Effect;
}

const M: Record<number, WmoEntry> = {
  0: { day: 'sun', night: 'moon', en: 'clear sky', de: 'klar', effect: null },
  1: {
    day: 'sun-high',
    night: 'moon',
    en: 'mainly clear',
    de: 'überwiegend klar',
    effect: null,
  },
  2: {
    day: 'sun-cloud',
    night: 'moon-cloud',
    en: 'partly cloudy',
    de: 'teils bewölkt',
    effect: null,
  },
  3: {
    day: 'clouds',
    night: 'clouds',
    en: 'overcast',
    de: 'bedeckt',
    effect: null,
  },
  45: {
    day: 'sun-fog',
    night: 'moon-fog',
    en: 'fog',
    de: 'Nebel',
    effect: null,
  },
  48: {
    day: 'fog',
    night: 'fog',
    en: 'rime fog',
    de: 'Raureifnebel',
    effect: null,
  },
  51: {
    day: 'cloud-rain-alt',
    night: 'cloud-rain-alt',
    en: 'light drizzle',
    de: 'leichter Niesel',
    effect: 'rain',
  },
  53: {
    day: 'cloud-rain-alt',
    night: 'cloud-rain-alt',
    en: 'drizzle',
    de: 'Niesel',
    effect: 'rain',
  },
  55: {
    day: 'cloud-rain-alt',
    night: 'cloud-rain-alt',
    en: 'dense drizzle',
    de: 'starker Niesel',
    effect: 'rain',
  },
  56: {
    day: 'cloud-sleet',
    night: 'cloud-sleet',
    en: 'freezing drizzle',
    de: 'gefrierender Niesel',
    effect: 'rain',
  },
  57: {
    day: 'cloud-sleet',
    night: 'cloud-sleet',
    en: 'freezing drizzle',
    de: 'gefrierender Niesel',
    effect: 'rain',
  },
  61: {
    day: 'cloud-rain',
    night: 'cloud-rain',
    en: 'light rain',
    de: 'leichter Regen',
    effect: 'rain',
  },
  63: {
    day: 'cloud-rain',
    night: 'cloud-rain',
    en: 'rain',
    de: 'Regen',
    effect: 'rain',
  },
  65: {
    day: 'cloud-rain',
    night: 'cloud-rain',
    en: 'heavy rain',
    de: 'starker Regen',
    effect: 'rain',
  },
  66: {
    day: 'cloud-sleet',
    night: 'cloud-sleet',
    en: 'freezing rain',
    de: 'gefrierender Regen',
    effect: 'rain',
  },
  67: {
    day: 'cloud-sleet',
    night: 'cloud-sleet',
    en: 'freezing rain',
    de: 'gefrierender Regen',
    effect: 'rain',
  },
  71: {
    day: 'cloud-snow',
    night: 'cloud-snow',
    en: 'light snow',
    de: 'leichter Schneefall',
    effect: 'snow',
  },
  73: {
    day: 'cloud-snow',
    night: 'cloud-snow',
    en: 'snow',
    de: 'Schneefall',
    effect: 'snow',
  },
  75: {
    day: 'cloud-snow',
    night: 'cloud-snow',
    en: 'heavy snow',
    de: 'starker Schneefall',
    effect: 'snow',
  },
  77: {
    day: 'cloud-snow-alt',
    night: 'cloud-snow-alt',
    en: 'snow grains',
    de: 'Schneegriesel',
    effect: 'snow',
  },
  80: {
    day: 'sun-cloud-rain',
    night: 'moon-cloud-rain',
    en: 'light showers',
    de: 'leichte Schauer',
    effect: 'rain',
  },
  81: {
    day: 'sun-cloud-rain',
    night: 'moon-cloud-rain',
    en: 'rain showers',
    de: 'Regenschauer',
    effect: 'rain',
  },
  82: {
    day: 'sun-cloud-rain',
    night: 'moon-cloud-rain',
    en: 'violent showers',
    de: 'heftige Schauer',
    effect: 'rain',
  },
  85: {
    day: 'sun-cloud-snow',
    night: 'moon-cloud-snow',
    en: 'snow showers',
    de: 'Schneeschauer',
    effect: 'snow',
  },
  86: {
    day: 'sun-cloud-snow',
    night: 'moon-cloud-snow',
    en: 'snow showers',
    de: 'Schneeschauer',
    effect: 'snow',
  },
  95: {
    day: 'sun-cloud-lightning',
    night: 'moon-cloud-lightning',
    en: 'thunderstorm',
    de: 'Gewitter',
    effect: 'thunder',
  },
  96: {
    day: 'cloud-hail',
    night: 'cloud-hail',
    en: 'thunderstorm with hail',
    de: 'Gewitter mit Hagel',
    effect: 'thunder',
  },
  99: {
    day: 'cloud-hail',
    night: 'cloud-hail',
    en: 'thunderstorm with hail',
    de: 'Gewitter mit Hagel',
    effect: 'thunder',
  },
};

export function wmoToIcon(code: number, isDay: boolean): string {
  const e = M[code];
  if (!e) return 'na';
  return isDay ? e.day : e.night;
}

export function wmoToLabel(code: number, locale: Locale = 'en'): string {
  return M[code]?.[locale] ?? '—';
}

export function wmoToEffect(code: number): Effect {
  return M[code]?.effect ?? null;
}

/** 45° sectors, N centered on 0°. */
export function windDirectionIcon(degrees: number): string {
  const dirs = [
    'north',
    'north-east',
    'east',
    'south-east',
    'south',
    'south-west',
    'west',
    'north-west',
  ];
  const idx = Math.round((((degrees % 360) + 360) % 360) / 45) % 8;
  return `compass-${dirs[idx]}`;
}

const MOONLIGHT = '#f3d9a4';

/**
 * Two tones for an icon on the colour band: white over translucent white, and
 * moonlight on the moon at night. The plain `moon` is a single part (base), so
 * the moonlight goes there too. docs/design/rules.md#icons
 */
export function heroIconColors(
  icon: string,
  isDay: boolean,
): { primary: string; secondary: string } {
  const moonlit = !isDay && icon.startsWith('moon');
  return {
    primary: moonlit ? MOONLIGHT : '#ffffff',
    secondary: moonlit && icon === 'moon' ? MOONLIGHT : 'rgba(255,255,255,0.5)',
  };
}
