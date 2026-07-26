/**
 * Random-city easter egg (Cmd+W), carried over from the original temps. A small
 * hand-picked world list — name, country, coordinates and IANA timezone. The
 * timezone is only a sensible default; the API's `timezone=auto` still governs
 * the displayed local time.
 */
import type { Place } from '../services/open-meteo';

export const RANDOM_CITIES: readonly Place[] = [
  {
    name: 'Reykjavík',
    country: 'IS',
    latitude: 64.15,
    longitude: -21.94,
    timezone: 'Atlantic/Reykjavik',
  },
  {
    name: 'Tromsø',
    country: 'NO',
    latitude: 69.65,
    longitude: 18.96,
    timezone: 'Europe/Oslo',
  },
  {
    name: 'Lisbon',
    country: 'PT',
    latitude: 38.72,
    longitude: -9.14,
    timezone: 'Europe/Lisbon',
  },
  {
    name: 'Marrakesh',
    country: 'MA',
    latitude: 31.63,
    longitude: -7.99,
    timezone: 'Africa/Casablanca',
  },
  {
    name: 'Cape Town',
    country: 'ZA',
    latitude: -33.92,
    longitude: 18.42,
    timezone: 'Africa/Johannesburg',
  },
  {
    name: 'Nairobi',
    country: 'KE',
    latitude: -1.29,
    longitude: 36.82,
    timezone: 'Africa/Nairobi',
  },
  {
    name: 'Istanbul',
    country: 'TR',
    latitude: 41.01,
    longitude: 28.98,
    timezone: 'Europe/Istanbul',
  },
  {
    name: 'Dubai',
    country: 'AE',
    latitude: 25.2,
    longitude: 55.27,
    timezone: 'Asia/Dubai',
  },
  {
    name: 'Kathmandu',
    country: 'NP',
    latitude: 27.71,
    longitude: 85.32,
    timezone: 'Asia/Kathmandu',
  },
  {
    name: 'Bangkok',
    country: 'TH',
    latitude: 13.76,
    longitude: 100.5,
    timezone: 'Asia/Bangkok',
  },
  {
    name: 'Singapore',
    country: 'SG',
    latitude: 1.35,
    longitude: 103.82,
    timezone: 'Asia/Singapore',
  },
  {
    name: 'Tokyo',
    country: 'JP',
    latitude: 35.68,
    longitude: 139.65,
    timezone: 'Asia/Tokyo',
  },
  {
    name: 'Sydney',
    country: 'AU',
    latitude: -33.87,
    longitude: 151.21,
    timezone: 'Australia/Sydney',
  },
  {
    name: 'Auckland',
    country: 'NZ',
    latitude: -36.85,
    longitude: 174.76,
    timezone: 'Pacific/Auckland',
  },
  {
    name: 'Honolulu',
    country: 'US',
    latitude: 21.31,
    longitude: -157.86,
    timezone: 'Pacific/Honolulu',
  },
  {
    name: 'San Francisco',
    country: 'US',
    latitude: 37.77,
    longitude: -122.42,
    timezone: 'America/Los_Angeles',
  },
  {
    name: 'Mexico City',
    country: 'MX',
    latitude: 19.43,
    longitude: -99.13,
    timezone: 'America/Mexico_City',
  },
  {
    name: 'Rio de Janeiro',
    country: 'BR',
    latitude: -22.91,
    longitude: -43.17,
    timezone: 'America/Sao_Paulo',
  },
  {
    name: 'Ushuaia',
    country: 'AR',
    latitude: -54.8,
    longitude: -68.3,
    timezone: 'America/Argentina/Ushuaia',
  },
  {
    name: 'Nuuk',
    country: 'GL',
    latitude: 64.18,
    longitude: -51.69,
    timezone: 'America/Nuuk',
  },
  {
    name: 'Vancouver',
    country: 'CA',
    latitude: 49.28,
    longitude: -123.12,
    timezone: 'America/Vancouver',
  },
];

/** Pick a random city different from `exclude`, when possible. */
export function randomCity(exclude?: Place): Place {
  const pool = exclude
    ? RANDOM_CITIES.filter(
        (c) =>
          c.latitude !== exclude.latitude || c.longitude !== exclude.longitude,
      )
    : RANDOM_CITIES;
  const list = pool.length > 0 ? pool : RANDOM_CITIES;
  return list[Math.floor(Math.random() * list.length)];
}
