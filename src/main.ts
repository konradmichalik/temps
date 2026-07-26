import { mount } from 'svelte';
import App from './App.svelte';
import Popover from './Popover.svelte';
import { isTauri } from './lib/utils/tauri';
import '@fontsource/rubik/300.css';
import '@fontsource/rubik/400.css';
import '@fontsource/rubik/500.css';
import './app.css';

// index.html serves both the Tauri popover and the web dev harness / landing
// demo. Inside Tauri we mount the real popover shell (with backend wiring);
// in the browser we mount the demo harness.
const app = mount(isTauri() ? Popover : App, {
  target: document.getElementById('app')!,
});
export default app;
