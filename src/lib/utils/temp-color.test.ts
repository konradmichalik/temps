import { describe, expect, it } from 'vitest';
import {
  tempToColor,
  TEMP_COLORS,
  backgroundColor,
  darken,
  accentDeep,
  contrastRatio,
  TILE_SURFACE,
  INK,
  inkOn,
  textSafe,
} from './temp-color';

describe('contrastRatio (WCAG relative luminance)', () => {
  it('matches the known extremes', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
  });
  it('is symmetric', () => {
    expect(contrastRatio('#1f2630', '#f5f4f1')).toBeCloseTo(
      contrastRatio('#f5f4f1', '#1f2630'),
      10,
    );
  });
});

describe('inkOn and textSafe (landing page text, WCAG 1.4.3)', () => {
  it('picks the ink that contrasts more', () => {
    expect(inkOn('#E3BB88')).toBe(INK);
    expect(inkOn('#6F7685')).toBe('#ffffff');
  });
  it('reaches 4.5:1 for every palette colour by day and by night', () => {
    for (const c of TEMP_COLORS) {
      for (const bg of [c, darken(c)]) {
        const safe = textSafe(bg);
        expect(contrastRatio(safe, inkOn(safe)), bg).toBeGreaterThanOrEqual(
          4.5,
        );
      }
    }
  });
  it('leaves colours alone that already pass', () => {
    expect(textSafe('#E3BB88')).toBe('#E3BB88');
  });
});

describe('accentDeep (marks on a tile, WCAG 1.4.11)', () => {
  it('reaches 3.3:1 on the tile surface for every palette color', () => {
    for (const c of TEMP_COLORS) {
      expect(contrastRatio(accentDeep(c), TILE_SURFACE)).toBeGreaterThanOrEqual(
        3.3,
      );
    }
  });
  it('keeps the original 0.18 darkening where that already passes', () => {
    expect(accentDeep('#b1695a')).toBe(darken('#b1695a', 0.18));
    expect(accentDeep('#6F7685')).toBe(darken('#6F7685', 0.18));
  });
  it('darkens no further than needed', () => {
    for (const c of TEMP_COLORS) {
      const deep = accentDeep(c);
      if (deep === darken(c, 0.18)) continue;
      let f = 0.18;
      while (darken(c, f) !== deep) f = Math.round((f + 0.02) * 100) / 100;
      const previous = darken(c, Math.round((f - 0.02) * 100) / 100);
      expect(contrastRatio(previous, TILE_SURFACE)).toBeLessThan(3.3);
    }
  });
});

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
