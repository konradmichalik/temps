/**
 * Single network abstraction: the Tauri build routes through plugin-http,
 * the web/landing build uses browser fetch (Open-Meteo is CORS-open).
 * This indirection is what makes the landing page live demo possible.
 */

type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

let tauriFetch: Fetcher | null = null;

async function resolveFetcher(): Promise<Fetcher> {
  if ('__TAURI__' in window) {
    if (!tauriFetch) {
      const mod = await import(
        /* @vite-ignore */ '@tauri-apps/plugin-http'
      ).catch(() => null);
      tauriFetch =
        (mod?.fetch as Fetcher | undefined) ?? window.fetch.bind(window);
    }
    return tauriFetch;
  }
  return window.fetch.bind(window);
}

export async function fetchJson<T>(url: string): Promise<T> {
  const f = await resolveFetcher();
  const res = await f(url, { headers: { Accept: 'application/json' } });
  if (!res.ok)
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}
