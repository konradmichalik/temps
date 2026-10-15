/**
 * Derived values for the detail tiles (docs/design/rules.md#tiles-and-their-data).
 * Pure functions over the API data, so the tiles stay presentational.
 */

export type Trend = 'rising' | 'falling' | 'steady';
export type UvBand = 'low' | 'moderate' | 'high' | 'very-high' | 'extreme';
export type Pollutant =
  'pm2_5' | 'pm10' | 'nitrogen_dioxide' | 'ozone' | 'sulphur_dioxide';

const HOUR = 3_600_000;

/** Pressure now against the hourly value closest to three hours ago. */
export function pressureTrend(
  current: number | null,
  hourly: { time: Date; pressure: number | null }[],
  now: Date,
): { trend: Trend; delta: number } | null {
  if (current === null) return null;
  const target = now.getTime() - 3 * HOUR;
  let best: { time: Date; pressure: number } | null = null;
  for (const p of hourly) {
    if (p.pressure === null) continue;
    const off = Math.abs(p.time.getTime() - target);
    if (
      off <= HOUR &&
      (!best || off < Math.abs(best.time.getTime() - target))
    ) {
      best = { time: p.time, pressure: p.pressure };
    }
  }
  if (!best) return null;
  const delta = Math.round((current - best.pressure) * 10) / 10;
  const trend =
    Math.abs(delta) < 1 ? 'steady' : delta > 0 ? 'rising' : 'falling';
  return { trend, delta };
}

const RAIN_LIKELY = 50;

/**
 * Bar height for a rain chance: nothing for a dry hour, and never a sliver
 * that reads as a baseline instead of rain.
 */
export function rainBarHeight(
  probability: number,
  lane: number,
  minVisible: number,
): number {
  if (probability <= 0) return 0;
  const h = (Math.min(probability, 100) / 100) * lane;
  return Math.max(h, minVisible);
}

/** The next twelve hours of rain chance and the first hour that is likely wet. */
export function rainOutlook<
  T extends { time: Date; precipitationProbability: number },
>(hourly: T[], now: Date): { hours: T[]; start: Date | null } {
  const from = hourly.findIndex((h) => h.time.getTime() + HOUR > now.getTime());
  const hours = from < 0 ? [] : hourly.slice(from, from + 12);
  const wet = hours.find((h) => h.precipitationProbability >= RAIN_LIKELY);
  return { hours, start: wet ? wet.time : null };
}

/** WHO UV index bands. */
export function uvBand(uv: number): UvBand {
  const v = Math.round(uv);
  if (v >= 11) return 'extreme';
  if (v >= 8) return 'very-high';
  if (v >= 6) return 'high';
  if (v >= 3) return 'moderate';
  return 'low';
}

const UV_LABELS: Record<'en' | 'de', Record<UvBand, string>> = {
  en: {
    low: 'low',
    moderate: 'moderate',
    high: 'high',
    'very-high': 'very high',
    extreme: 'extreme',
  },
  de: {
    low: 'niedrig',
    moderate: 'mäßig',
    high: 'hoch',
    'very-high': 'sehr hoch',
    extreme: 'extrem',
  },
};

export function uvLabel(uv: number, locale: 'en' | 'de'): string {
  return UV_LABELS[locale][uvBand(uv)];
}

/** Highest UV for the rest of the local day; null once there is none left. */
export function uvPeak(
  hourly: { time: Date; uvIndex: number }[],
  now: Date,
  timezone: string,
): { time: Date; value: number } | null {
  const day = localDay(now, timezone);
  let peak: { time: Date; value: number } | null = null;
  for (const p of hourly) {
    if (p.time.getTime() + HOUR <= now.getTime()) continue;
    if (localDay(p.time, timezone) !== day) continue;
    if (!peak || p.uvIndex > peak.value)
      peak = { time: p.time, value: p.uvIndex };
  }
  return peak && peak.value > 0 ? peak : null;
}

/** The European AQI sub-index that drives the overall index. */
export function leadingPollutant(
  sub: Partial<Record<Pollutant, number | null>>,
): Pollutant | null {
  let lead: Pollutant | null = null;
  let max = -Infinity;
  for (const [key, value] of Object.entries(sub) as [
    Pollutant,
    number | null,
  ][]) {
    if (value !== null && value !== undefined && value > max) {
      max = value;
      lead = key;
    }
  }
  return lead;
}

const POLLUTANT_LABELS: Record<'en' | 'de', Record<Pollutant, string>> = {
  en: {
    pm2_5: 'fine dust',
    pm10: 'dust',
    nitrogen_dioxide: 'nitrogen dioxide',
    ozone: 'ozone',
    sulphur_dioxide: 'sulphur dioxide',
  },
  de: {
    pm2_5: 'Feinstaub',
    pm10: 'Staub',
    nitrogen_dioxide: 'Stickstoffdioxid',
    ozone: 'Ozon',
    sulphur_dioxide: 'Schwefeldioxid',
  },
};

export function pollutantLabel(p: Pollutant, locale: 'en' | 'de'): string {
  return POLLUTANT_LABELS[locale][p];
}

const DIRECTIONS: Record<'en' | 'de', string[]> = {
  en: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'],
  de: ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'],
};

/** Where the wind comes from, in the same eight sectors as the compass icon. */
export function windDirectionLabel(
  degrees: number,
  locale: 'en' | 'de',
): string {
  const idx = Math.round((((degrees % 360) + 360) % 360) / 45) % 8;
  return DIRECTIONS[locale][idx];
}

/** Thermometer and rounded difference between felt and measured temperature. */
export function feelsLike(
  temperature: number,
  apparent: number,
): { icon: string; delta: number } {
  const delta = Math.round(apparent) - Math.round(temperature);
  const icon =
    delta > 0
      ? 'thermometer-hot'
      : delta < 0
        ? 'thermometer-cold'
        : 'thermometer-medium';
  return { icon, delta };
}

function localDay(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(date);
}
