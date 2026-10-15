/**
 * Open-Meteo integration. One request feeds all three screens.
 * No API key. Attribution "Weather data by Open-Meteo.com" (CC BY 4.0)
 * is mandatory and lives in the About section + landing page.
 */
import { fetchJson } from '../utils/fetch';
import type { Unit } from '../utils/temp-color';

export interface Place {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface CurrentWeather {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  /** Null when the model has no value for the place. */
  dewPoint: number | null;
  weatherCode: number;
  isDay: boolean;
  windSpeed: number;
  windGusts: number | null;
  windDirection: number;
  /** Sea-level pressure, comparable between places and over time. */
  pressure: number | null;
  uvIndex: number;
}

export interface HourlyPoint {
  time: Date;
  temperature: number;
  weatherCode: number;
  precipitationProbability: number;
  pressure: number | null;
  uvIndex: number;
}

export interface DailyPoint {
  date: Date;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  sunrise: Date;
  sunset: Date;
  uvIndexMax: number;
  precipitationProbabilityMax: number;
}

export interface RainSlot {
  time: Date;
  precipitation: number;
}

export interface WeatherData {
  place: Place;
  fetchedAt: Date;
  timezone: string;
  utcOffsetSeconds: number;
  current: CurrentWeather;
  hourly: HourlyPoint[];
  daily: DailyPoint[];
  minutely15: RainSlot[];
}

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';

export async function fetchWeather(
  place: Place,
  unit: Unit,
): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    current: [
      'temperature_2m',
      'apparent_temperature',
      'relative_humidity_2m',
      'dew_point_2m',
      'weather_code',
      'is_day',
      'wind_speed_10m',
      'wind_gusts_10m',
      'wind_direction_10m',
      'pressure_msl',
      'uv_index',
    ].join(','),
    hourly: [
      'temperature_2m',
      'weather_code',
      'precipitation_probability',
      'pressure_msl',
      'uv_index',
    ].join(','),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'sunrise',
      'sunset',
      'uv_index_max',
      'precipitation_probability_max',
    ].join(','),
    minutely_15: 'precipitation',
    forecast_days: '5',
    timezone: 'auto',
    temperature_unit: unit,
  });
  const raw = await fetchJson<OpenMeteoResponse>(`${FORECAST_URL}?${params}`);
  return transform(place, raw);
}

export async function searchPlaces(
  query: string,
  language: 'en' | 'de' = 'en',
): Promise<Place[]> {
  if (query.trim().length < 2) return [];
  const params = new URLSearchParams({
    name: query.trim(),
    count: '6',
    language,
  });
  const raw = await fetchJson<{ results?: GeoResult[] }>(
    `${GEOCODING_URL}?${params}`,
  );
  return (raw.results ?? []).map((r) => ({
    name: r.name,
    country: r.country_code?.toUpperCase() ?? '',
    latitude: r.latitude,
    longitude: r.longitude,
    timezone: r.timezone ?? 'UTC',
  }));
}

/* ---------------------------------------------------------------- */

interface GeoResult {
  name: string;
  country_code?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export interface OpenMeteoResponse {
  timezone: string;
  utc_offset_seconds: number;
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    dew_point_2m: number | null;
    weather_code: number;
    is_day: number;
    wind_speed_10m: number;
    wind_gusts_10m: number | null;
    wind_direction_10m: number;
    pressure_msl: number | null;
    uv_index: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    precipitation_probability: number[];
    pressure_msl: (number | null)[];
    uv_index: (number | null)[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: number[];
    precipitation_probability_max: number[];
  };
  minutely_15?: { time: string[]; precipitation: number[] };
}

export function transform(place: Place, r: OpenMeteoResponse): WeatherData {
  // API returns local wall-clock ISO strings (timezone=auto); attach the
  // offset so Date objects are unambiguous instants.
  const off = r.utc_offset_seconds;
  const toDate = (iso: string) =>
    new Date(iso.length <= 16 ? `${iso}:00${offsetSuffix(off)}` : iso);

  return {
    place,
    fetchedAt: new Date(),
    timezone: r.timezone,
    utcOffsetSeconds: off,
    current: {
      temperature: r.current.temperature_2m,
      apparentTemperature: r.current.apparent_temperature,
      humidity: r.current.relative_humidity_2m,
      dewPoint: r.current.dew_point_2m ?? null,
      weatherCode: r.current.weather_code,
      isDay: r.current.is_day === 1,
      windSpeed: r.current.wind_speed_10m,
      windGusts: r.current.wind_gusts_10m ?? null,
      windDirection: r.current.wind_direction_10m,
      pressure: r.current.pressure_msl ?? null,
      uvIndex: r.current.uv_index,
    },
    hourly: r.hourly.time.map((t, i) => ({
      time: toDate(t),
      temperature: r.hourly.temperature_2m[i],
      weatherCode: r.hourly.weather_code[i],
      precipitationProbability: r.hourly.precipitation_probability[i] ?? 0,
      pressure: r.hourly.pressure_msl?.[i] ?? null,
      uvIndex: r.hourly.uv_index?.[i] ?? 0,
    })),
    daily: r.daily.time.map((t, i) => ({
      date: toDate(t + 'T12:00'),
      weatherCode: r.daily.weather_code[i],
      tempMax: r.daily.temperature_2m_max[i],
      tempMin: r.daily.temperature_2m_min[i],
      sunrise: toDate(r.daily.sunrise[i]),
      sunset: toDate(r.daily.sunset[i]),
      uvIndexMax: r.daily.uv_index_max[i],
      precipitationProbabilityMax:
        r.daily.precipitation_probability_max[i] ?? 0,
    })),
    minutely15: (r.minutely_15?.time ?? []).map((t, i) => ({
      time: toDate(t),
      precipitation: r.minutely_15!.precipitation[i] ?? 0,
    })),
  };
}

function offsetSuffix(seconds: number): string {
  const sign = seconds < 0 ? '-' : '+';
  const abs = Math.abs(seconds);
  const h = String(Math.floor(abs / 3600)).padStart(2, '0');
  const m = String(Math.floor((abs % 3600) / 60)).padStart(2, '0');
  return `${sign}${h}:${m}`;
}
