import { describe, expect, it } from 'vitest';
import { transform, type OpenMeteoResponse } from './open-meteo';

const place = {
  name: 'Dresden',
  country: 'DE',
  latitude: 51.05,
  longitude: 13.74,
  timezone: 'Europe/Berlin',
};

const raw: OpenMeteoResponse = {
  timezone: 'Europe/Berlin',
  utc_offset_seconds: 7200,
  current: {
    time: '2026-10-14T10:15',
    temperature_2m: 14.2,
    apparent_temperature: 12.9,
    relative_humidity_2m: 71,
    dew_point_2m: 10.2,
    weather_code: 2,
    is_day: 1,
    wind_speed_10m: 12.4,
    wind_gusts_10m: 25.2,
    wind_direction_10m: 230,
    pressure_msl: 1027.6,
    uv_index: 2.1,
  },
  hourly: {
    time: ['2026-10-14T10:00'],
    temperature_2m: [14],
    weather_code: [2],
    precipitation_probability: [5],
    pressure_msl: [1027.2],
    uv_index: [2.3],
  },
  daily: {
    time: ['2026-10-14'],
    weather_code: [2],
    temperature_2m_max: [16],
    temperature_2m_min: [8],
    sunrise: ['2026-10-14T07:31'],
    sunset: ['2026-10-14T18:39'],
    uv_index_max: [2.4],
    precipitation_probability_max: [10],
  },
};

describe('transform', () => {
  it('maps dew point, gusts and sea-level pressure into the current reading', () => {
    const c = transform(place, raw).current;
    expect(c.dewPoint).toBe(10.2);
    expect(c.windGusts).toBe(25.2);
    expect(c.pressure).toBe(1027.6);
  });

  it('keeps values a model does not provide as null', () => {
    const sparse: OpenMeteoResponse = {
      ...raw,
      current: {
        ...raw.current,
        dew_point_2m: null,
        wind_gusts_10m: null,
        pressure_msl: null,
      },
      hourly: { ...raw.hourly, pressure_msl: [null], uv_index: [null] },
    };
    const w = transform(place, sparse);
    expect(w.current.dewPoint).toBeNull();
    expect(w.current.windGusts).toBeNull();
    expect(w.current.pressure).toBeNull();
    expect(w.hourly[0].pressure).toBeNull();
    expect(w.hourly[0].uvIndex).toBe(0);
  });

  it('maps hourly pressure and UV', () => {
    const h = transform(place, raw).hourly[0];
    expect(h.pressure).toBe(1027.2);
    expect(h.uvIndex).toBe(2.3);
    expect(h.time.toISOString()).toBe('2026-10-14T08:00:00.000Z');
  });
});
