import { describe, expect, it } from 'vitest';
import spriteRaw from 'weather-iconic/sprites?raw';
import { splitParts, weatherSymbol } from './weather-sprite';

describe('splitParts', () => {
  it('wraps the first of two groups as highlight, the second as base', () => {
    const out = splitParts(
      '<g transform="matrix(1,0,0,1,1,1)"><path d="M1"/></g> <g><path d="M2"/></g>',
    );
    expect(out).toBe(
      '<g class="hl"><g transform="matrix(1,0,0,1,1,1)"><path d="M1"/></g></g>' +
        '<g class="base"><g><path d="M2"/></g></g>',
    );
  });

  it('wraps a single group as base', () => {
    expect(
      splitParts('<g transform="translate(0 -.32)"><path d="M1"/></g>'),
    ).toBe(
      '<g class="base"><g transform="translate(0 -.32)"><path d="M1"/></g></g>',
    );
  });

  it('treats a top-level path like a group and keeps nested groups intact', () => {
    expect(
      splitParts('<path d="M0"/><g><g><path d="M1"/></g><path d="M2"/></g>'),
    ).toBe(
      '<g class="hl"><path d="M0"/></g>' +
        '<g class="base"><g><g><path d="M1"/></g><path d="M2"/></g></g>',
    );
  });
});

describe('weatherSymbol', () => {
  it('splits every symbol of the installed sprite into wrapped parts', () => {
    const ids = [...spriteRaw.matchAll(/<symbol\s+id="weather-([^"]+)"/g)].map(
      (m) => m[1],
    );
    expect(ids.length).toBeGreaterThan(90);
    for (const id of ids) {
      const inner = weatherSymbol(id)!.inner;
      const parts = inner.match(/<g class="(hl|base)">/g) ?? [];
      expect(parts.length, id).toBeGreaterThanOrEqual(1);
      expect(inner.startsWith('<g class="'), id).toBe(true);
    }
  });

  it('keeps every original transform attribute', () => {
    const raw = spriteRaw.match(
      /<symbol\s+id="weather-cloud-rain"[^>]*>([\s\S]*?)<\/symbol>/,
    )![1];
    const before = raw.match(/transform="[^"]*"/g);
    expect(
      weatherSymbol('cloud-rain')!.inner.match(/transform="[^"]*"/g),
    ).toEqual(before);
  });
});
