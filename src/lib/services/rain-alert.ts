/**
 * Rain-alert decision logic (pure — no Svelte, no Tauri).
 *
 * Given the `minutely_15.precipitation` slots for the active location, decide
 * whether to fire a "rain starting soon" notification. The tricky part is
 * debouncing: we alert at most once per rain event and only re-arm after the
 * sky has been dry again for a while. All state is threaded in and out so the
 * behavior is fully testable.
 */
import type { RainSlot } from './open-meteo';

/** Precipitation (mm per 15 min) above which a slot counts as "wet". */
const WET = 0.1;
/** How far ahead we look for incoming rain. */
const HORIZON_MIN = 120;
/** The sky must be clear for at least this long ahead to re-arm the alert. */
const REARM_MIN = 60;

export interface RainAlertState {
  /** True after an alert fired, until a dry spell re-arms it (debounce). */
  armed: boolean;
}

export interface RainAlertResult {
  notify: boolean;
  minutesUntil: number | null;
  state: RainAlertState;
}

export interface RainAlertOptions {
  utcOffsetSeconds: number;
  respectQuietHours: boolean;
}

/** True during local quiet hours (23:00–07:00), computed from the API offset. */
export function isQuietHour(now: Date, utcOffsetSeconds: number): boolean {
  const localMs = now.getTime() + utcOffsetSeconds * 1000;
  const hour = ((Math.floor(localMs / 3_600_000) % 24) + 24) % 24;
  return hour >= 23 || hour < 7;
}

export function analyzeRainAlert(
  slots: RainSlot[],
  now: Date,
  prev: RainAlertState,
  opts: RainAlertOptions,
): RainAlertResult {
  const nowMs = now.getTime();
  const minutesAway = (s: RainSlot) => (s.time.getTime() - nowMs) / 60_000;

  // Current conditions: the most recent slot at/before now, else the first slot.
  const past = slots.filter((s) => s.time.getTime() <= nowMs);
  const currentPrecip = past.length
    ? past[past.length - 1].precipitation
    : (slots[0]?.precipitation ?? 0);
  const currentlyDry = currentPrecip <= WET;

  const upcoming = slots.filter((s) => s.time.getTime() > nowMs);
  const firstRain =
    upcoming.find(
      (s) => minutesAway(s) <= HORIZON_MIN && s.precipitation > WET,
    ) ?? null;
  const rainWithinHour = upcoming.some(
    (s) => minutesAway(s) <= REARM_MIN && s.precipitation > WET,
  );

  let armed = prev.armed;
  // Re-arm once it's dry now and stays dry for the next hour.
  if (currentlyDry && !rainWithinHour) armed = false;

  let notify = false;
  let minutesUntil: number | null = null;

  if (firstRain && currentlyDry && !armed) {
    const quiet =
      opts.respectQuietHours && isQuietHour(now, opts.utcOffsetSeconds);
    if (!quiet) {
      notify = true;
      minutesUntil = Math.max(0, Math.round(minutesAway(firstRain)));
      armed = true;
    }
  }

  return { notify, minutesUntil, state: { armed } };
}
