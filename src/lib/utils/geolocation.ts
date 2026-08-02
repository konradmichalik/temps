/**
 * Current device coordinates. In the macOS app this goes through the native
 * CoreLocation command (the Tauri geolocation plugin is mobile-only); on the
 * web it uses the browser Geolocation API. Rejects on denial/timeout/no-support.
 */
import { isTauri, invoke } from './tauri';

export interface Coords {
  latitude: number;
  longitude: number;
}

export async function getCurrentCoords(): Promise<Coords> {
  if (isTauri()) {
    const r = await invoke<[number, number]>('get_current_location');
    if (!r) throw new Error('location failed');
    return { latitude: r[0], longitude: r[1] };
  }

  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      reject(new Error('unavailable'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) =>
        resolve({
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
        }),
      (e) => reject(e),
      { timeout: 10000 },
    );
  });
}

/** Whether a location button makes sense to show at all. */
export function canLocate(): boolean {
  return (
    isTauri() ||
    (typeof navigator !== 'undefined' && 'geolocation' in navigator)
  );
}
