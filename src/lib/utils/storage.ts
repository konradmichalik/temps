/**
 * Persistence with two backends behind one signature:
 *   - the Tauri build persists to plugin-store (`temps.json` in app data),
 *   - the web/landing/standalone builds use `localStorage`.
 *
 * The synchronous `loadJson`/`saveJson` (localStorage only) still exist so store
 * constructors can seed instant defaults on the web without awaiting. In the
 * Tauri build, stores seed from localStorage (usually empty), then `hydrate()`
 * overrides from plugin-store via the async variants below.
 */
import { isTauri } from './tauri';

export function loadJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`temps:${key}`);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function saveJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(`temps:${key}`, JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode, node) — state stays in memory */
  }
}

/* ---- Tauri plugin-store (async) ------------------------------------------ */

interface TauriStore {
  get<T>(key: string): Promise<T | undefined>;
  set(key: string, value: unknown): Promise<void>;
  save(): Promise<void>;
}

let storePromise: Promise<TauriStore> | null = null;

function tauriStore(): Promise<TauriStore> {
  if (!storePromise) {
    storePromise = import('@tauri-apps/plugin-store').then((m) =>
      m.load('temps.json'),
    ) as Promise<TauriStore>;
  }
  return storePromise;
}

export async function loadJsonAsync<T>(key: string): Promise<T | null> {
  if (isTauri()) {
    try {
      const store = await tauriStore();
      return (await store.get<T>(key)) ?? null;
    } catch {
      return null;
    }
  }
  return loadJson<T>(key);
}

export async function saveJsonAsync(
  key: string,
  value: unknown,
): Promise<void> {
  if (isTauri()) {
    try {
      const store = await tauriStore();
      await store.set(key, value);
      await store.save();
      return;
    } catch {
      /* fall through to localStorage as a best-effort backup */
    }
  }
  saveJson(key, value);
}
