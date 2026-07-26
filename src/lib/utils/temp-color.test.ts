import { describe, expect, it } from 'vitest';
import {
  tempToColor,
  TEMP_COLORS,
  backgroundColor,
  darken,
} from './temp-color';

describe('tempToColor (thresholds from original color.js)', () => {
  it('maps celsius boundaries exactly like the original', () => {
    expect(tempToColor(31)).toBe(TEMP_COLORS[0]);
    expect(tempToColor(30)).toBe(TEMP_COLORS[1]); // > 30 is exclusive
    expect(tempToColor(27)).toBe(TEMP_COLORS[1]);
    expect(tempToColor(23)).toBe(TEMP_COLORS[2]);
    expect(tempToColor(19)).toBe(TEMP_COLORS[3]);
    expect(tempToColor(15)).toBe(TEMP_COLORS[4]);
    expect(tempToColor(11)).toBe(TEMP_COLORS[5]);
    expect(tempToColor(7)).toBe(TEMP_COLORS[6]);
    expect(tempToColor(3)).toBe(TEMP_COLORS[7]);
    expect(tempToColor(2)).toBe(TEMP_COLORS[8]);
    expect(tempToColor(-9)).toBe(TEMP_COLORS[8]);
  });
  it('rounds like the original (11.6 -> 12)', () => {
    expect(tempToColor(10.6)).toBe(TEMP_COLORS[5]);
  });
  it('maps fahrenheit thresholds', () => {
    expect(tempToColor(87, 'fahrenheit')).toBe(TEMP_COLORS[0]);
    expect(tempToColor(36, 'fahrenheit')).toBe(TEMP_COLORS[7]);
    expect(tempToColor(35, 'fahrenheit')).toBe(TEMP_COLORS[8]);
  });
  it('darkens for night', () => {
    const day = backgroundColor(18, 'celsius', true);
    const night = backgroundColor(18, 'celsius', false);
    expect(day).toBe(TEMP_COLORS[4]);
    expect(night).toBe(darken(TEMP_COLORS[4]));
    expect(night).not.toBe(day);
  });
});
