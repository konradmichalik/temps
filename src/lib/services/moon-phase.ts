/**
 * Open-Meteo has no moon phase endpoint; a synodic-month approximation is
 * accurate to well under a day, which is enough to pick one of 8 icons.
 */

const SYNODIC = 29.53058867; // days
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14); // reference new moon

/** Returns the phase as a fraction 0..1 (0 = new moon, 0.5 = full moon). */
export function moonPhase(date: Date = new Date()): number {
  const days = (date.getTime() - KNOWN_NEW_MOON) / 86_400_000;
  return (((days % SYNODIC) + SYNODIC) % SYNODIC) / SYNODIC;
}

/** Lit fraction of the disc, 0..1. */
export function moonIllumination(phase: number): number {
  return (1 - Math.cos(2 * Math.PI * phase)) / 2;
}

/** Whole days until the next full moon (0 on the day itself). */
export function daysUntilFullMoon(date: Date = new Date()): number {
  const ahead = (((0.5 - moonPhase(date)) % 1) + 1) % 1;
  return Math.round(ahead * SYNODIC) % Math.round(SYNODIC);
}

const PHASE_ICONS = [
  'moon-newmoon',
  'moon-waxing-crescent',
  'moon-first-quarter',
  'moon-waxing-gibbous',
  'moon-fullmoon',
  'moon-waning-gibbous',
  'moon-last-quarter',
  'moon-waning-crescent',
] as const;

const PHASE_LABELS: Record<'en' | 'de', string[]> = {
  en: [
    'new moon',
    'waxing crescent',
    'first quarter',
    'waxing gibbous',
    'full moon',
    'waning gibbous',
    'last quarter',
    'waning crescent',
  ],
  de: [
    'Neumond',
    'zunehmende Sichel',
    'erstes Viertel',
    'zunehmender Mond',
    'Vollmond',
    'abnehmender Mond',
    'letztes Viertel',
    'abnehmende Sichel',
  ],
};

export function moonPhaseIndex(date: Date = new Date()): number {
  // Center each of the 8 buckets on its canonical phase point.
  return Math.round(moonPhase(date) * 8) % 8;
}

export function moonPhaseIcon(date: Date = new Date()): string {
  return PHASE_ICONS[moonPhaseIndex(date)];
}

export function moonPhaseLabel(
  date: Date = new Date(),
  locale: 'en' | 'de' = 'en',
): string {
  return PHASE_LABELS[locale][moonPhaseIndex(date)];
}
