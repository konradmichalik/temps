<script lang="ts">
  /**
   * Tauri popover shell. Renders the shared AppCard at the fixed popover size
   * and wires it to the Rust backend:
   *   - hydrate stores from plugin-store, then load weather
   *   - drive the tray color-dot / menubar temperature from the current weather
   *   - honor the polling interval, global shortcut and autostart settings
   *   - react to backend `refresh` / `open-settings` events
   *   - run the rain-alert after every refresh
   * All of this is inert in the web builds (the helpers no-op), but this
   * component is only mounted when running inside Tauri.
   */
  import { onMount } from 'svelte';
  import AppCard from './lib/components/layout/AppCard.svelte';
  import { weather } from './lib/stores/weather.svelte';
  import { settings } from './lib/stores/settings.svelte';
  import { favorites } from './lib/stores/favorites.svelte';
  import { rainAlert } from './lib/stores/rain-alert.svelte';
  import { tempToColor } from './lib/utils/temp-color';
  import { invoke, listen } from './lib/utils/tauri';

  const GLOBAL_SHORTCUT = 'CmdOrCtrl+Shift+W';

  let settingsOpen = $state(false);
  let ready = $state(false);

  function hexToRgb(hex: string): [number, number, number] {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
  }

  onMount(() => {
    const unlisten: Array<() => void> = [];

    (async () => {
      await Promise.all([settings.hydrate(), favorites.hydrate()]);

      // Autostart: the plugin is the source of truth; reflect it into settings.
      try {
        const { isEnabled } = await import('@tauri-apps/plugin-autostart');
        settings.autostart = await isEnabled();
      } catch {
        /* plugin unavailable (web) */
      }

      ready = true;
      await weather.load();

      unlisten.push(
        await listen('refresh', () => weather.load(weather.place, true)),
        await listen('open-settings', () => (settingsOpen = true)),
      );
    })();

    return () => unlisten.forEach((fn) => fn());
  });

  // Refresh weather + re-run the rain alert whenever new data lands.
  $effect(() => {
    if (weather.data) void rainAlert.check(weather.data);
  });

  // Tray: temperature-colored dot + optional menubar temperature text.
  $effect(() => {
    if (!ready || !weather.data) return;
    const temp = weather.data.current.temperature;
    const rgb = hexToRgb(tempToColor(temp, settings.unit));
    const tempText = settings.menubarTemp ? `${Math.round(temp)}°` : null;
    void invoke('update_tray', {
      rgb,
      showDot: settings.colorIndicator,
      tempText,
    });
  });

  // Polling interval (Rust heartbeat → `refresh` events).
  $effect(() => {
    if (!ready) return;
    void invoke('start_polling', { intervalMinutes: settings.pollingMinutes });
  });

  // Global toggle shortcut (default registered in Rust; reflect the setting).
  $effect(() => {
    if (!ready) return;
    if (settings.globalShortcutEnabled) {
      void invoke('set_global_shortcut', { accelerator: GLOBAL_SHORTCUT });
    } else {
      void invoke('clear_global_shortcut');
    }
  });

  // Autostart (start at login).
  $effect(() => {
    if (!ready) return;
    const on = settings.autostart;
    void (async () => {
      try {
        const { enable, disable, isEnabled } =
          await import('@tauri-apps/plugin-autostart');
        const current = await isEnabled();
        if (on && !current) await enable();
        else if (!on && current) await disable();
      } catch {
        /* plugin unavailable */
      }
    })();
  });
</script>

<div class="popover">
  <AppCard bind:settingsOpen />
</div>

<style>
  .popover {
    width: var(--popover-width);
    height: var(--popover-height);
    overflow: hidden;
  }
  /* The window itself is transparent + frameless; the card paints the rounded
     surface and shadow. Keep the body background clear so corners stay round. */
  :global(html),
  :global(body) {
    background: transparent !important;
  }
</style>
