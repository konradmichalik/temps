/**
 * Rasterizes the current weather-iconic symbol into a PNG the Rust tray can
 * use as the menubar icon. Rendering happens here (not in Rust) because the
 * sprite + multi-color logic already live in JS; Rust only whitens the result
 * into a template image and optionally composites the color-indicator dot.
 *
 * macOS scales the whole image to the menubar height, and weather-iconic glyphs
 * carry uneven internal padding — so we crop to the glyph's actual bounding box
 * and rescale it to fill the frame, giving a consistently large menubar icon.
 *
 * Returns the PNG as a plain number[] so it crosses the Tauri IPC boundary as
 * JSON. Null when rendering isn't possible (unknown icon, no DOM, decode fail).
 */
import { weatherSymbol } from './weather-sprite';

/** Matches the @2x tray asset so the menubar stays crisp on retina. */
const SIZE = 88;
/** Breathing room around the tightly-cropped glyph. */
const MARGIN = SIZE * 0.05;

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

  // 1. Render the glyph at natural fit.
  const src = document.createElement('canvas');
  src.width = src.height = SIZE;
  const sctx = src.getContext('2d');
  if (!sctx) return null;
  sctx.drawImage(img, 0, 0, SIZE, SIZE);

  // 2. Find the opaque bounding box.
  const { data } = sctx.getImageData(0, 0, SIZE, SIZE);
  let minX = SIZE;
  let minY = SIZE;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (data[(y * SIZE + x) * 4 + 3] > 12) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // 3. Crop to the glyph and rescale it to fill the frame (aspect preserved).
  const dst = document.createElement('canvas');
  dst.width = dst.height = SIZE;
  const dctx = dst.getContext('2d');
  if (!dctx) return null;
  if (maxX >= minX && maxY >= minY) {
    const bw = maxX - minX + 1;
    const bh = maxY - minY + 1;
    const scale = Math.min((SIZE - MARGIN * 2) / bw, (SIZE - MARGIN * 2) / bh);
    const dw = bw * scale;
    const dh = bh * scale;
    dctx.drawImage(
      src,
      minX,
      minY,
      bw,
      bh,
      (SIZE - dw) / 2,
      (SIZE - dh) / 2,
      dw,
      dh,
    );
  } else {
    dctx.drawImage(src, 0, 0);
  }

  const blob = await new Promise<Blob | null>((resolve) =>
    dst.toBlob((b) => resolve(b), 'image/png'),
  );
  if (!blob) return null;

  const buf = await blob.arrayBuffer();
  return Array.from(new Uint8Array(buf));
}
