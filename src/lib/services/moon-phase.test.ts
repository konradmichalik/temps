import { describe, expect, it } from 'vitest';
import {
  daysUntilFullMoon,
  moonIllumination,
  moonPhase,
  moonPhaseIcon,
} from './moon-phase';

describe('moonIllumination', () => {
  it('is dark at new moon, half at the quarters and full at full moon', () => {
    expect(moonIllumination(0)).toBeCloseTo(0, 5);
    expect(moonIllumination(0.25)).toBeCloseTo(0.5, 5);
    expect(moonIllumination(0.5)).toBeCloseTo(1, 5);
    expect(moonIllumination(0.75)).toBeCloseTo(0.5, 5);
  });
});

describe('daysUntilFullMoon', () => {
  it('counts down to the next full moon (2026-01-03 10:03 UTC)', () => {
    expect(daysUntilFullMoon(new Date(Date.UTC(2025, 11, 30, 10, 3)))).toBe(4);
    expect(daysUntilFullMoon(new Date(Date.UTC(2026, 0, 3, 10, 3)))).toBe(0);
  });
  it('starts the next cycle the day after a full moon', () => {
    expect(daysUntilFullMoon(new Date(Date.UTC(2026, 0, 4, 10, 3)))).toBe(29);
  });
});

/** Known full moons (UTC): tolerance is one 8th-phase bucket. */
describe('moonPhase', () => {
  it('detects known full moons (phase near 0.5)', () => {
    const fullMoons = [
      Date.UTC(2024, 3, 23, 23, 49),
      Date.UTC(2025, 0, 13, 22, 27),
      Date.UTC(2026, 0, 3, 10, 3),
    ];
    for (const t of fullMoons) {
      const p = moonPhase(new Date(t));
      expect(Math.abs(p - 0.5)).toBeLessThan(0.04);
      expect(moonPhaseIcon(new Date(t))).toBe('moon-fullmoon');
    }
  });
  it('detects known new moons (phase near 0 or 1)', () => {
    const newMoons = [
      Date.UTC(2024, 3, 8, 18, 21),
      Date.UTC(2025, 11, 20, 1, 43),
    ];
    for (const t of newMoons) {
      const p = moonPhase(new Date(t));
      expect(Math.min(p, 1 - p)).toBeLessThan(0.04);
      expect(moonPhaseIcon(new Date(t))).toBe('moon-newmoon');
    }
  });
});
