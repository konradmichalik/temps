import { describe, expect, it } from 'vitest';
import { moonPhase, moonPhaseIcon } from './moon-phase';

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
