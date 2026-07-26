/**
 * Thin, safe wrappers around the Tauri API. Everything degrades to a no-op in
 * the web/landing builds, so callers never need to branch: the same code runs
 * in the popover and in the browser. Tauri modules are imported dynamically so
 * they stay out of the web bundle entirely.
 */

export const isTauri = (): boolean =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export async function invoke<T = void>(
  cmd: string,
  args?: Record<string, unknown>,
): Promise<T | undefined> {
  if (!isTauri()) return undefined;
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<T>(cmd, args);
  } catch (e) {
    console.error(`invoke(${cmd}) failed:`, e);
    return undefined;
  }
}

/** Subscribe to a backend event. Returns an unlisten function (no-op on web). */
export async function listen<T>(
  event: string,
  handler: (payload: T) => void,
): Promise<() => void> {
  if (!isTauri()) return () => {};
  try {
    const { listen } = await import('@tauri-apps/api/event');
    return await listen<T>(event, (e) => handler(e.payload));
  } catch (e) {
    console.error(`listen(${event}) failed:`, e);
    return () => {};
  }
}
