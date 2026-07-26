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
