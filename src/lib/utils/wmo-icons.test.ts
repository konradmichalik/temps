import { describe, expect, it } from 'vitest';
import {
  wmoToIcon,
  wmoToLabel,
  wmoToEffect,
  windDirectionIcon,
  heroIconColors,
} from './wmo-icons';

describe('heroIconColors (icons on the colour band)', () => {
  it('is white over translucent white by day', () => {
    expect(heroIconColors('sun-cloud', true)).toEqual({
      primary: '#ffffff',
      secondary: 'rgba(255,255,255,0.5)',
    });
  });
  it('lights the moon highlight at night', () => {
    expect(heroIconColors('moon-cloud', false).primary).toBe('#f3d9a4');
    expect(heroIconColors('cloud-rain', false).primary).toBe('#ffffff');
  });
  it('lights the whole single-part moon at night', () => {
    expect(heroIconColors('moon', false)).toEqual({
      primary: '#f3d9a4',
      secondary: '#f3d9a4',
    });
  });
});

describe('wmoToIcon', () => {
  it('covers all documented WMO codes', () => {
    const codes = [
      0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75,
      77, 80, 81, 82, 85, 86, 95, 96, 99,
    ];
    for (const c of codes) {
      expect(wmoToIcon(c, true)).not.toBe('na');
      expect(wmoToIcon(c, false)).not.toBe('na');
    }
  });
  it('switches day/night variants', () => {
    expect(wmoToIcon(0, true)).toBe('sun');
    expect(wmoToIcon(0, false)).toBe('moon');
    expect(wmoToIcon(80, false)).toBe('moon-cloud-rain');
  });
  it('falls back to na for unknown codes', () => {
    expect(wmoToIcon(42, true)).toBe('na');
  });
  it('maps effects', () => {
    expect(wmoToEffect(61)).toBe('rain');
    expect(wmoToEffect(75)).toBe('snow');
    expect(wmoToEffect(95)).toBe('thunder');
    expect(wmoToEffect(0)).toBeNull();
  });
  it('has labels in both locales', () => {
    expect(wmoToLabel(61, 'en')).toBe('light rain');
    expect(wmoToLabel(61, 'de')).toBe('leichter Regen');
  });
});

describe('windDirectionIcon', () => {
  it('maps 45-degree sectors', () => {
    expect(windDirectionIcon(0)).toBe('compass-north');
    expect(windDirectionIcon(90)).toBe('compass-east');
    expect(windDirectionIcon(180)).toBe('compass-south');
    expect(windDirectionIcon(270)).toBe('compass-west');
    expect(windDirectionIcon(359)).toBe('compass-north');
    expect(windDirectionIcon(44)).toBe('compass-north-east');
  });
});
