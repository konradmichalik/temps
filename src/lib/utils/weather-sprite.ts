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
  symbols.set(m[1], { viewBox: m[2], inner: m[3] });
}

/** Look up a symbol by its short name (e.g. `cloud-rain` → `weather-cloud-rain`). */
export function weatherSymbol(name: string): WeatherSymbol | undefined {
  return symbols.get(`weather-${name}`);
}
