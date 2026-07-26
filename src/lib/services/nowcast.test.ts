import { describe, expect, it } from 'vitest';
import { analyzeNowcast, nowcastLabel } from './nowcast';
import type { RainSlot } from './open-meteo';

const NOW = new Date('2026-07-16T12:00:00Z');

function slots(values: number[]): RainSlot[] {
  return values.map((precipitation, i) => ({
    time: new Date(NOW.getTime() + i * 15 * 60_000),
    precipitation,
  }));
}

describe('analyzeNowcast', () => {
  it('is silent when dry throughout', () => {
    const n = analyzeNowcast(slots([0, 0, 0, 0, 0, 0, 0, 0]), NOW);
    expect(n.kind).toBeNull();
    expect(nowcastLabel(n, 'en')).toBeNull();
  });
  it('announces rain start with rounded minutes', () => {
    const n = analyzeNowcast(slots([0, 0.4, 0.6, 0.2, 0, 0, 0, 0]), NOW);
    expect(n.kind).toBe('starts');
    expect(n.minutes).toBe(15);
    expect(nowcastLabel(n, 'de')).toBe('Regen in ~15 min');
  });
  it('announces rain end while raining', () => {
    const n = analyzeNowcast(slots([0.5, 0.4, 0, 0, 0, 0, 0, 0]), NOW);
    expect(n.kind).toBe('stops');
    expect(n.minutes).toBe(30);
  });
  it('reports ongoing rain past the window', () => {
    const n = analyzeNowcast(
      slots([0.5, 0.4, 0.6, 0.5, 0.4, 0.3, 0.5, 0.6]),
      NOW,
    );
    expect(n.kind).toBe('ongoing');
  });
  it('ignores drizzle below threshold', () => {
    const n = analyzeNowcast(slots([0.05, 0.05, 0.05, 0, 0, 0, 0, 0]), NOW);
    expect(n.kind).toBeNull();
  });
  it('handles empty minutely data (outside coverage)', () => {
    expect(analyzeNowcast([], NOW).kind).toBeNull();
  });
});
