import { mount } from 'svelte';
import Landing from './Landing.svelte';
import '@fontsource/rubik/300.css';
import '@fontsource/rubik/400.css';
import '@fontsource/rubik/500.css';
import '../app.css';

const app = mount(Landing, { target: document.getElementById('app')! });
export default app;
