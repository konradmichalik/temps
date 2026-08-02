/**
 * Rasterizes the current weather-iconic symbol into a PNG the Rust tray can
 * use as the menubar icon. Rendering happens here (not in Rust) because the
 * sprite + multi-color logic already live in JS; Rust only whitens the result
 * into a template image and optionally composites the color-indicator dot.
 *
 * Returns the PNG as a plain number[] so it crosses the Tauri IPC boundary as
 * JSON. Null when rendering isn't possible (unknown icon, no DOM, decode fail).
 */
import { weatherSymbol } from './weather-sprite';

/** Matches the @2x tray asset so the menubar stays crisp on retina. */
const SIZE = 88;
/** Small inset only — the glyph should fill most of the menubar height. */
const PAD = SIZE * 0.03;

export async function renderTrayIconPng(
  name: string,
): Promise<number[] | null> {
  if (typeof document === 'undefined') return null;

  const sym = weatherSymbol(name);
  if (!sym) return null;

  // Force white: the raw sprite paths carry no fill (they rely on CSS in the
  // app), so wrapping them in a white-filled group gives a clean silhouette.
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${sym.viewBox}" ` +
    `width="${SIZE}" height="${SIZE}"><g fill="#ffffff">${sym.inner}</g></svg>`;

  const img = new Image();
  const loaded = new Promise<boolean>((resolve) => {
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
  });
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  if (!(await loaded)) return null;

  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(img, PAD, PAD, SIZE - PAD * 2, SIZE - PAD * 2);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/png'),
  );
  if (!blob) return null;

  const buf = await blob.arrayBuffer();
  return Array.from(new Uint8Array(buf));
}
