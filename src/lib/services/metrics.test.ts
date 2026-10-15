import { describe, expect, it } from 'vitest';
import {
  feelsLike,
  leadingPollutant,
  pressureTrend,
  rainBarHeight,
  rainOutlook,
  uvBand,
  uvPeak,
  windDirectionLabel,
} from './metrics';

const at = (iso: string) => new Date(iso);

describe('pressureTrend (3 h difference, under 1 hPa is steady)', () => {
  const hourly = [
    { time: at('2026-10-14T06:00:00Z'), pressure: 1012.4 },
    { time: at('2026-10-14T07:00:00Z'), pressure: 1013.0 },
    { time: at('2026-10-14T08:00:00Z'), pressure: 1014.1 },
  ];
  it('reads rising when the pressure gained at least 1 hPa', () => {
    expect(pressureTrend(1015.2, hourly, at('2026-10-14T09:10:00Z'))).toEqual({
      trend: 'rising',
      delta: 2.8,
    });
  });
  it('reads falling and steady', () => {
    expect(
      pressureTrend(1010.0, hourly, at('2026-10-14T09:00:00Z'))?.trend,
    ).toBe('falling');
    expect(
      pressureTrend(1013.1, hourly, at('2026-10-14T09:00:00Z'))?.trend,
    ).toBe('steady');
  });
  it('is unknown without a current value and skips missing hourly values', () => {
    expect(pressureTrend(null, hourly, at('2026-10-14T09:10:00Z'))).toBeNull();
    const gaps = [{ time: at('2026-10-14T06:00:00Z'), pressure: null }];
    expect(pressureTrend(1015, gaps, at('2026-10-14T09:00:00Z'))).toBeNull();
  });
  it('is unknown without a value near three hours ago', () => {
    expect(pressureTrend(1013, hourly, at('2026-10-14T14:00:00Z'))).toBeNull();
  });
});

describe('uvBand (WHO)', () => {
  it('maps the band edges', () => {
    expect([0, 2.4, 3, 5.4, 6, 7.4, 8, 10.4, 11].map(uvBand)).toEqual([
      'low',
      'low',
      'moderate',
      'moderate',
      'high',
      'high',
      'very-high',
      'very-high',
      'extreme',
    ]);
  });
});

describe('uvPeak', () => {
  const tz = 'Europe/Berlin';
  const hourly = [
    { time: at('2026-07-14T09:00:00Z'), uvIndex: 5 },
    { time: at('2026-07-14T11:00:00Z'), uvIndex: 7.2 },
    { time: at('2026-07-14T13:00:00Z'), uvIndex: 6 },
    { time: at('2026-07-15T11:00:00Z'), uvIndex: 9 },
  ];
  it('finds the highest value for the rest of the local day', () => {
    expect(uvPeak(hourly, at('2026-07-14T08:30:00Z'), tz)).toEqual({
      time: at('2026-07-14T11:00:00Z'),
      value: 7.2,
    });
  });
  it('ignores tomorrow and returns nothing once the sun is gone', () => {
    const night = [{ time: at('2026-07-14T20:00:00Z'), uvIndex: 0 }, hourly[3]];
    expect(uvPeak(night, at('2026-07-14T19:30:00Z'), tz)).toBeNull();
  });
});

describe('leadingPollutant', () => {
  it('picks the highest European sub-index', () => {
    expect(
      leadingPollutant({
        pm2_5: 26,
        pm10: 14,
        nitrogen_dioxide: 18,
        ozone: 31,
        sulphur_dioxide: 2,
      }),
    ).toBe('ozone');
  });
  it('is null without any sub-index', () => {
    expect(leadingPollutant({ pm2_5: null, ozone: null })).toBeNull();
  });
});

describe('rainOutlook (next 12 hours)', () => {
  const now = at('2026-10-14T09:20:00Z');
  const hours = Array.from({ length: 16 }, (_, i) => ({
    time: new Date(at('2026-10-14T08:00:00Z').getTime() + i * 3_600_000),
    precipitationProbability: i < 7 ? 10 : 60,
  }));
  it('starts at the current hour and covers twelve hours', () => {
    const o = rainOutlook(hours, now);
    expect(o.hours).toHaveLength(12);
    expect(o.hours[0].time.toISOString()).toBe('2026-10-14T09:00:00.000Z');
  });
  it('names the first hour at 50 % or more', () => {
    expect(rainOutlook(hours, now).start?.toISOString()).toBe(
      '2026-10-14T15:00:00.000Z',
    );
  });
  it('has no start when it stays dry', () => {
    const dry = hours.map((h) => ({ ...h, precipitationProbability: 20 }));
    expect(rainOutlook(dry, now).start).toBeNull();
  });
});

describe('rainBarHeight', () => {
  it('draws nothing for a dry hour', () => {
    expect(rainBarHeight(0, 16, 2.4)).toBe(0);
    expect(rainBarHeight(-3, 16, 2.4)).toBe(0);
  });
  it('lifts a small chance to the visible minimum', () => {
    // 5 % of a 16 unit lane is 0.8 units, well under one pixel on screen.
    expect(rainBarHeight(5, 16, 2.4)).toBe(2.4);
  });
  it('scales larger chances linearly and caps at the lane', () => {
    expect(rainBarHeight(50, 16, 2.4)).toBe(8);
    expect(rainBarHeight(140, 16, 2.4)).toBe(16);
  });
});

describe('windDirectionLabel', () => {
  it('names where the wind comes from in eight sectors', () => {
    expect(windDirectionLabel(225, 'en')).toBe('SW');
    expect(windDirectionLabel(44, 'de')).toBe('NO');
    expect(windDirectionLabel(359, 'en')).toBe('N');
    expect(windDirectionLabel(90, 'de')).toBe('O');
  });
});

describe('feelsLike', () => {
  it('picks the thermometer by the rounded difference', () => {
    expect(feelsLike(28, 30.2)).toEqual({ icon: 'thermometer-hot', delta: 2 });
    expect(feelsLike(3, -1.6)).toEqual({ icon: 'thermometer-cold', delta: -5 });
    expect(feelsLike(12, 12.4)).toEqual({
      icon: 'thermometer-medium',
      delta: 0,
    });
  });
});
