/**
 * Deterministic weather for the landing demo modes (?demo=...) and as a
 * graceful fallback when the network is unavailable. Scenarios mirror the
 * three cards of the original screenshot-overview.png.
 */
import type { Place, WeatherData } from '../services/open-meteo';

export type DemoScenario = 'sunny' | 'rain' | 'snow' | 'thunder' | 'night';

interface ScenarioSpec {
  place: Place;
  temp: number;
  code: number;
  isDay: boolean;
}

const SPECS: Record<DemoScenario, ScenarioSpec> = {
  rain: {
    place: p('Dresden', 'DE', 51.05, 13.74, 'Europe/Berlin'),
    temp: 12,
    code: 61,
    isDay: true,
  },
  sunny: {
    place: p('Hamburg', 'DE', 53.55, 9.99, 'Europe/Berlin'),
    temp: 18,
    code: 0,
    isDay: true,
  },
  snow: {
    place: p('Oslo', 'NO', 59.91, 10.75, 'Europe/Oslo'),
    temp: -2,
    code: 73,
    isDay: true,
  },
  thunder: {
    place: p('Vienna', 'AT', 48.21, 16.37, 'Europe/Vienna'),
    temp: 24,
    code: 95,
    isDay: true,
  },
  night: {
    place: p('New York', 'US', 40.71, -74.01, 'America/New_York'),
    temp: -9,
    code: 0,
    isDay: false,
  },
};

function p(
  name: string,
  country: string,
  latitude: number,
  longitude: number,
  timezone: string,
): Place {
  return { name, country, latitude, longitude, timezone };
}

export function demoWeather(
  scenario: DemoScenario = 'sunny',
  now = new Date(),
): WeatherData {
  const s = SPECS[scenario];
  const hourStart = new Date(now);
  hourStart.setMinutes(0, 0, 0);

  // The sunny demo stays completely dry, so it shows no rain bars at all.
  const dry = scenario === 'sunny';
  // Starts six hours back, like the API's midnight start, so trends have a past.
  const hourly = Array.from({ length: 54 }, (_, k) => {
    const i = k - 6;
    const t = new Date(hourStart.getTime() + i * 3_600_000);
    const wave = Math.sin((i / 24) * Math.PI * 2 - Math.PI / 2); // trough at start
    // Daylight UV as a bell around 13:00; pressure falls in the wet scenarios.
    const hour = t.getHours();
    const sun = Math.max(0, Math.cos(((hour - 13) / 7) * (Math.PI / 2)));
    return {
      time: t,
      temperature:
        Math.round((s.temp + wave * 4 + Math.sin(i * 1.7) * 0.8) * 10) / 10,
      weatherCode: s.code,
      precipitationProbability: s.code >= 51 ? 60 : dry ? 0 : 5,
      pressure:
        Math.round((1016 + (s.code >= 51 ? -0.6 : 0.4) * (i - 3)) * 10) / 10,
      uvIndex: s.isDay ? Math.round(sun * 6 * 10) / 10 : 0,
    };
  });

  const dayCodes = [s.code, 80, 2, 0, 95];
  const daily = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    d.setHours(12, 0, 0, 0);
    const sunrise = new Date(d);
    sunrise.setHours(6, 42);
    const sunset = new Date(d);
    sunset.setHours(20, 18);
    return {
      date: d,
      weatherCode: dayCodes[i % dayCodes.length],
      tempMax: s.temp + 2 + i,
      tempMin: s.temp - 4 + i,
      sunrise,
      sunset,
      uvIndexMax: 4,
      precipitationProbabilityMax: s.code >= 51 ? 70 : dry ? 0 : 10,
    };
  });

  // Rainy scenarios get a nowcast timeline: raining now, stopping in ~40 min.
  const quarter = new Date(now);
  quarter.setMinutes(Math.floor(quarter.getMinutes() / 15) * 15, 0, 0);
  const minutely15 =
    s.code >= 51
      ? Array.from({ length: 8 }, (_, i) => ({
          time: new Date(quarter.getTime() + i * 15 * 60_000),
          precipitation: i < 3 ? 0.6 : 0,
        }))
      : [];

  return {
    place: s.place,
    fetchedAt: now,
    timezone: s.place.timezone,
    utcOffsetSeconds: 0,
    current: {
      temperature: s.temp,
      apparentTemperature: s.temp - 2,
      humidity: 64,
      dewPoint: s.temp - 6,
      weatherCode: s.code,
      isDay: s.isDay,
      windSpeed: 14,
      windGusts: 28,
      windDirection: 225,
      pressure: hourly[6].pressure,
      uvIndex: s.isDay ? 4 : 0,
    },
    hourly,
    daily,
    minutely15,
  };
}
