/**
 * Design DNA of temps: the full-bleed background color derives from the
 * current temperature. Palette and thresholds are taken verbatim from the
 * original app (temps-legacy, src/main/config.json + src/utilities/color.js).
 * Never change these values.
 */

export const TEMP_COLORS = [
  '#b1695a', // hottest
  '#DB9864',
  '#E3BB88',
  '#D0C7A8',
  '#B1C2A3',
  '#80BBB2',
  '#6D9E96',
  '#8F95A5',
  '#6F7685', // coldest
] as const;

export const ERROR_COLOR = '#444444';

/** Upper-exclusive thresholds; temp > threshold[i] selects color[i]. */
const THRESHOLDS_C = [30, 26, 22, 18, 14, 10, 6, 2] as const;
const THRESHOLDS_F = [86, 78, 71, 64, 57, 50, 42, 35] as const;

export type Unit = 'celsius' | 'fahrenheit';

export function tempToColor(temp: number, unit: Unit = 'celsius'): string {
  const thresholds = unit === 'celsius' ? THRESHOLDS_C : THRESHOLDS_F;
  const t = Math.round(temp);
  for (let i = 0; i < thresholds.length; i++) {
    if (t > thresholds[i]) return TEMP_COLORS[i];
  }
  return TEMP_COLORS[TEMP_COLORS.length - 1];
}

/**
 * Night variant: same hue, lightness reduced by ~35% (relative), matching
 * the dark night screen of the original screenshots.
 */
export function darken(hex: string, factor = 0.35): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  const [h, s, l] = rgbToHsl(r, g, b);
  const [r2, g2, b2] = hslToRgb(h, s, l * (1 - factor));
  return (
    '#' + [r2, g2, b2].map((v) => v.toString(16).padStart(2, '0')).join('')
  );
}

/** Tile surface the accent marks sit on (`--tile` in app.css). */
export const TILE_SURFACE = '#f5f4f1';

const MARK_CONTRAST = 3.3;

/** WCAG 2.x contrast ratio between two hex colors. */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * The accent for marks on a tile (icon highlights, bars, scale dots): the
 * accent darkened until it holds 3.3:1 on the tile surface, so the lighter
 * palette colors still meet WCAG 1.4.11.
 */
export function accentDeep(accent: string): string {
  let factor = 0.18;
  let out = darken(accent, factor);
  while (contrastRatio(out, TILE_SURFACE) < MARK_CONTRAST && factor < 0.6) {
    factor = Math.round((factor + 0.02) * 100) / 100;
    out = darken(accent, factor);
  }
  return out;
}

/** Ink on paper and tiles (`--ink` in app.css). */
export const INK = '#1f2630';

/** Text color for a colored background: ink or white, whichever contrasts more. */
export function inkOn(background: string): string {
  return contrastRatio(background, INK) >= contrastRatio(background, '#ffffff')
    ? INK
    : '#ffffff';
}

/**
 * The background darkened in 0.02 steps until its text color reaches 4.5:1
 * (WCAG 1.4.3). Most palette colors pass unchanged.
 */
export function textSafe(background: string): string {
  let factor = 0;
  let out = background;
  while (contrastRatio(out, inkOn(out)) < 4.5 && factor < 0.5) {
    factor = Math.round((factor + 0.02) * 100) / 100;
    out = darken(background, factor);
  }
  return out;
}

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function backgroundColor(
  temp: number,
  unit: Unit,
  isDay: boolean,
): string {
  const base = tempToColor(temp, unit);
  return isDay ? base : darken(base);
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case r:
      h = (g - b) / d + (g < b ? 6 : 0);
      break;
    case g:
      h = (b - r) / d + 2;
      break;
    default:
      h = (r - g) / d + 4;
  }
  return [h / 6, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [
    Math.round(f(h + 1 / 3) * 255),
    Math.round(f(h) * 255),
    Math.round(f(h - 1 / 3) * 255),
  ];
}
