import type { Place } from '../services/open-meteo';
import { loadJson, loadJsonAsync, saveJsonAsync } from '../utils/storage';

const MAX = 5;
const key = (p: Place) => `${p.latitude.toFixed(2)},${p.longitude.toFixed(2)}`;

class FavoritesStore {
  list = $state<Place[]>(loadJson<Place[]>('favorites') ?? []);

  /** Pull persisted favorites from plugin-store (Tauri) over the seeded list. */
  async hydrate(): Promise<void> {
    const saved = await loadJsonAsync<Place[]>('favorites');
    if (saved) this.list = saved;
  }

  has(place: Place): boolean {
    return this.list.some((p) => key(p) === key(place));
  }

  toggle(place: Place): void {
    if (this.has(place)) {
      this.list = this.list.filter((p) => key(p) !== key(place));
    } else if (this.list.length < MAX) {
      this.list = [...this.list, place];
    }
    void saveJsonAsync('favorites', this.list);
  }

  get full(): boolean {
    return this.list.length >= MAX;
  }
}

export const favorites = new FavoritesStore();
