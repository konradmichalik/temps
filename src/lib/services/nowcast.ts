/**
 * Precipitation nowcast from Open-Meteo minutely_15 data (next 2 hours).
 * Feeds the overview nowcast strip and, in the Tauri build, the rain
 * notification (same logic, one source of truth).
 */
import type { RainSlot } from './open-meteo';

const WET = 0.1; // mm per 15-min slot
const WINDOW_MIN = 120;

export type NowcastKind = 'starts' | 'stops' | 'ongoing' | null;

export interface Nowcast {
  kind: NowcastKind;
  /** Minutes from now until the transition (starts/stops). */
  minutes?: number;
  /** Slot-wise wetness for the strip visualization (8 slots = 2 h). */
  strip: boolean[];
}

export function analyzeNowcast(
  slots: RainSlot[],
  now: Date = new Date(),
): Nowcast {
  const t0 = now.getTime();
  const upcoming = slots
    .filter((s) => {
      const dt = (s.time.getTime() - t0) / 60_000;
      return dt > -15 && dt <= WINDOW_MIN;
    })
    .slice(0, 8);

  const strip = upcoming.map((s) => s.precipitation >= WET);
  if (upcoming.length === 0) return { kind: null, strip };

  const wetNow = strip[0];

  if (!wetNow) {
    const idx = strip.findIndex(Boolean);
    if (idx === -1) return { kind: null, strip };
    return {
      kind: 'starts',
      minutes: minutesUntil(upcoming[idx].time, t0),
      strip,
    };
  }

  const idx = strip.findIndex((w) => !w);
  if (idx === -1) return { kind: 'ongoing', strip };
  return {
    kind: 'stops',
    minutes: minutesUntil(upcoming[idx].time, t0),
    strip,
  };
}

function minutesUntil(time: Date, t0: number): number {
  // Round to friendly 5-minute steps, never below 5.
  const raw = (time.getTime() - t0) / 60_000;
  return Math.max(5, Math.round(raw / 5) * 5);
}

export function nowcastLabel(n: Nowcast, locale: 'en' | 'de'): string | null {
  const de = locale === 'de';
  switch (n.kind) {
    case 'starts':
      return de ? `Regen in ~${n.minutes} min` : `rain in ~${n.minutes} min`;
    case 'stops':
      return de
        ? `Regen endet in ~${n.minutes} min`
        : `rain ending in ~${n.minutes} min`;
    case 'ongoing':
      return de ? 'Regen hält an' : 'rain continues';
    default:
      return null;
  }
}
