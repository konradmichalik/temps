/**
 * Open-Meteo Air Quality API (v1.1 feature): European AQI + pollen.
 * Pollen is only available in Europe — absent fields hide the tiles.
 */
import { fetchJson } from '../utils/fetch';
import type { Place } from './open-meteo';

const URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';

const POLLEN_KEYS = [
  'alder_pollen',
  'birch_pollen',
  'grass_pollen',
  'mugwort_pollen',
  'olive_pollen',
  'ragweed_pollen',
] as const;

export interface PollenReading {
  species: string;
  value: number;
}

export interface AirQuality {
  aqi: number | null;
  pm25: number | null;
  pollen: PollenReading[];
  fetchedAt: Date;
}

const SPECIES_LABELS: Record<string, { en: string; de: string }> = {
  alder_pollen: { en: 'alder', de: 'Erle' },
  birch_pollen: { en: 'birch', de: 'Birke' },
  grass_pollen: { en: 'grass', de: 'Gräser' },
  mugwort_pollen: { en: 'mugwort', de: 'Beifuß' },
  olive_pollen: { en: 'olive', de: 'Olive' },
  ragweed_pollen: { en: 'ragweed', de: 'Ambrosia' },
};

export function pollenLabel(species: string, locale: 'en' | 'de'): string {
  return SPECIES_LABELS[species]?.[locale] ?? species;
}

/** European AQI bands (0-20 good … >100 extremely poor). */
export function aqiLabel(aqi: number, locale: 'en' | 'de'): string {
  const de = locale === 'de';
  if (aqi <= 20) return de ? 'gut' : 'good';
  if (aqi <= 40) return de ? 'okay' : 'fair';
  if (aqi <= 60) return de ? 'mäßig' : 'moderate';
  if (aqi <= 80) return de ? 'schlecht' : 'poor';
  if (aqi <= 100) return de ? 'sehr schlecht' : 'very poor';
  return de ? 'extrem' : 'extreme';
}

interface Raw {
  current?: Record<string, number | null>;
}

export async function fetchAirQuality(place: Place): Promise<AirQuality> {
  const params = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    current: ['european_aqi', 'pm2_5', ...POLLEN_KEYS].join(','),
  });
  const raw = await fetchJson<Raw>(`${URL}?${params}`);
  const c = raw.current ?? {};
  return {
    aqi: c.european_aqi ?? null,
    pm25: c.pm2_5 ?? null,
    pollen: POLLEN_KEYS.map((k) => ({ species: k, value: c[k] ?? 0 }))
      .filter((p) => p.value > 0)
      .sort((a, b) => b.value - a.value),
    fetchedAt: new Date(),
  };
}
