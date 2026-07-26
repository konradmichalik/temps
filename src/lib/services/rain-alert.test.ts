import { describe, expect, it } from 'vitest';
import {
  analyzeRainAlert,
  isQuietHour,
  type RainAlertState,
} from './rain-alert';
import type { RainSlot } from './open-meteo';

// 12:00 UTC — for a UTC location this is midday, outside quiet hours.
const NOW = new Date('2026-07-16T12:00:00Z');
const DISARMED: RainAlertState = { armed: false };
const OPTS = { utcOffsetSeconds: 0, respectQuietHours: true };

function slots(values: number[]): RainSlot[] {
  return values.map((precipitation, i) => ({
    time: new Date(NOW.getTime() + i * 15 * 60_000),
    precipitation,
  }));
}

describe('analyzeRainAlert', () => {
  it('stays silent when dry throughout', () => {
    const r = analyzeRainAlert(
      slots([0, 0, 0, 0, 0, 0, 0, 0]),
      NOW,
      DISARMED,
      OPTS,
    );
    expect(r.notify).toBe(false);
    expect(r.state.armed).toBe(false);
  });

  it('alerts when dry now and rain arrives within 2h', () => {
    // rain in slot 2 → ~30 min ahead
    const r = analyzeRainAlert(
      slots([0, 0, 0.5, 0.6, 0, 0, 0, 0]),
      NOW,
      DISARMED,
      OPTS,
    );
    expect(r.notify).toBe(true);
    expect(r.minutesUntil).toBe(30);
    expect(r.state.armed).toBe(true);
  });

  it('does not re-alert while still armed (debounce)', () => {
    const wet = slots([0, 0.5, 0.6, 0.4, 0, 0, 0, 0]);
    const first = analyzeRainAlert(wet, NOW, DISARMED, OPTS);
    expect(first.notify).toBe(true);
    const second = analyzeRainAlert(wet, NOW, first.state, OPTS);
    expect(second.notify).toBe(false);
    expect(second.state.armed).toBe(true);
  });

  it('does not alert while it is already raining', () => {
    const r = analyzeRainAlert(
      slots([0.5, 0.6, 0.5, 0, 0, 0, 0, 0]),
      NOW,
      DISARMED,
      OPTS,
    );
    expect(r.notify).toBe(false);
  });

  it('re-arms after the sky clears for the next hour', () => {
    // Fired earlier, now dry with no rain within the next hour → armed resets.
    const r = analyzeRainAlert(
      slots([0, 0, 0, 0, 0, 0.5, 0.6, 0]),
      NOW,
      { armed: true },
      OPTS,
    );
    // rain is >60 min away (slot 5 = 75 min), so it re-arms AND alerts again.
    expect(r.state.armed).toBe(true);
    expect(r.notify).toBe(true);
    expect(r.minutesUntil).toBe(75);
  });

  it('stays armed while rain remains within the hour', () => {
    const r = analyzeRainAlert(
      slots([0, 0, 0.5, 0.6, 0, 0, 0, 0]),
      NOW,
      { armed: true },
      OPTS,
    );
    expect(r.state.armed).toBe(true);
    expect(r.notify).toBe(false);
  });

  it('suppresses alerts during quiet hours', () => {
    // 03:00 UTC → quiet for a UTC location.
    const night = new Date('2026-07-16T03:00:00Z');
    const nightSlots = [0, 0, 0.5, 0.6, 0, 0, 0, 0].map((precipitation, i) => ({
      time: new Date(night.getTime() + i * 15 * 60_000),
      precipitation,
    }));
    const r = analyzeRainAlert(nightSlots, night, DISARMED, OPTS);
    expect(r.notify).toBe(false);
  });

  it('alerts at night when quiet hours are disabled', () => {
    const night = new Date('2026-07-16T03:00:00Z');
    const nightSlots = [0, 0, 0.5, 0.6, 0, 0, 0, 0].map((precipitation, i) => ({
      time: new Date(night.getTime() + i * 15 * 60_000),
      precipitation,
    }));
    const r = analyzeRainAlert(nightSlots, night, DISARMED, {
      utcOffsetSeconds: 0,
      respectQuietHours: false,
    });
    expect(r.notify).toBe(true);
  });
});

describe('isQuietHour', () => {
  it('is quiet at 23:00 and 06:00 local, awake at noon', () => {
    expect(isQuietHour(new Date('2026-07-16T23:30:00Z'), 0)).toBe(true);
    expect(isQuietHour(new Date('2026-07-16T06:00:00Z'), 0)).toBe(true);
    expect(isQuietHour(new Date('2026-07-16T12:00:00Z'), 0)).toBe(false);
  });

  it('respects the location offset (not the system timezone)', () => {
    // 22:00 UTC + 2h offset = 00:00 local → quiet.
    expect(isQuietHour(new Date('2026-07-16T22:00:00Z'), 7200)).toBe(true);
    // 06:00 UTC − 5h offset = 01:00 local → quiet.
    expect(isQuietHour(new Date('2026-07-16T06:00:00Z'), -18000)).toBe(true);
  });
});
