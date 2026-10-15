/**
 * weather-iconic symbol loader.
 *
 * The multi-color mechanism (drops vs. cloud, rays vs. sun, mercury vs. tube)
 * is driven by per-path CSS. That only works when the symbol markup lives in
 * the light DOM — a `<use href="external.svg#id">` clones the symbol into a
 * shadow tree that document CSS selectors cannot reach, so every icon renders
 * in the default black fill. We therefore inline the raw sprite and hand each
 * symbol's inner markup to WeatherIcon, which renders it directly.
 */
import spriteRaw from 'weather-iconic/sprites?raw';

export interface WeatherSymbol {
  viewBox: string;
  inner: string;
}

const symbols = new Map<string, WeatherSymbol>();

const RE =
  /<symbol\s+id="([^"]+)"\s+viewBox="([^"]+)"\s*>([\s\S]*?)<\/symbol>/g;
for (let m = RE.exec(spriteRaw); m !== null; m = RE.exec(spriteRaw)) {
  symbols.set(m[1], { viewBox: m[2], inner: splitParts(m[3]) });
}

/**
 * Wraps the symbol's top-level elements in `<g class="hl">` (the first of
 * several: drops, rays, mercury) and `<g class="base">` (the rest, or the only
 * one). Color and motion target these wrappers, so the original groups keep
 * their own `transform`, which a CSS transform would otherwise replace.
 */
export function splitParts(inner: string): string {
  const tops: string[] = [];
  let depth = 0;
  let start = 0;
  for (const t of inner.matchAll(/<(\/?)(g|path)\b[^>]*?(\/?)>/g)) {
    const closing = t[1] === '/';
    const selfClosing = t[3] === '/';
    if (!closing && depth === 0) start = t.index;
    if (!closing && !selfClosing) depth++;
    if (closing) depth--;
    if (depth === 0) tops.push(inner.slice(start, t.index + t[0].length));
  }
  const [first, ...rest] = tops;
  if (rest.length === 0) return `<g class="base">${first ?? ''}</g>`;
  return `<g class="hl">${first}</g><g class="base">${rest.join('')}</g>`;
}

/** Look up a symbol by its short name (e.g. `cloud-rain` → `weather-cloud-rain`). */
export function weatherSymbol(name: string): WeatherSymbol | undefined {
  return symbols.get(`weather-${name}`);
}
