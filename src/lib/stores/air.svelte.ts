import { fetchAirQuality, type AirQuality } from '../services/air-quality';
import type { Place } from '../services/open-meteo';

const TTL = 60 * 60_000; // 1 h cache per place

class AirStore {
  data = $state<AirQuality | null>(null);

  #cache = new Map<string, AirQuality>();
  #pending: string | null = null;

  async load(place: Place, demo = false): Promise<void> {
    if (demo) {
      this.data = {
        aqi: 24,
        pm25: 6.1,
        pollen: [
          { species: 'grass_pollen', value: 28 },
          { species: 'birch_pollen', value: 9 },
        ],
        fetchedAt: new Date(),
      };
      return;
    }
    const key = `${place.latitude},${place.longitude}`;
    const cached = this.#cache.get(key);
    if (cached && Date.now() - cached.fetchedAt.getTime() < TTL) {
      this.data = cached;
      return;
    }
    if (this.#pending === key) return;
    this.#pending = key;
    try {
      const fresh = await fetchAirQuality(place);
      this.#cache.set(key, fresh);
      this.data = fresh;
    } catch {
      this.data = cached ?? null; // tiles simply hide without data
    } finally {
      this.#pending = null;
    }
  }
}

export const air = new AirStore();
