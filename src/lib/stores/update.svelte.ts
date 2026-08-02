import { checkForUpdate, type UpdateInfo } from '../services/update-check';

/**
 * Holds the result of the GitHub release check. Populated once per session
 * (desktop app only); the UI reads `info` to show an update hint.
 */
class UpdateStore {
  info = $state<UpdateInfo | null>(null);
  #checked = false;

  async check(currentVersion: string): Promise<void> {
    if (this.#checked) return;
    this.#checked = true;
    this.info = await checkForUpdate(currentVersion);
  }
}

export const update = new UpdateStore();
