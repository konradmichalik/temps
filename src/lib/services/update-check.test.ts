import { describe, it, expect } from 'vitest';
import { isNewer, parseVersion } from './update-check';

describe('parseVersion', () => {
  it('parses plain and v-prefixed semver', () => {
    expect(parseVersion('1.2.3')).toEqual({ core: [1, 2, 3], pre: null });
    expect(parseVersion('v1.2.3')).toEqual({ core: [1, 2, 3], pre: null });
  });

  it('parses pre-release ordinals', () => {
    expect(parseVersion('2.0.0-beta.1')).toEqual({ core: [2, 0, 0], pre: 1 });
    expect(parseVersion('2.0.0-rc.4')).toEqual({ core: [2, 0, 0], pre: 4 });
  });

  it('rejects garbage', () => {
    expect(parseVersion('nightly')).toBeNull();
    expect(parseVersion('')).toBeNull();
  });
});

describe('isNewer', () => {
  it('detects major/minor/patch bumps', () => {
    expect(isNewer('1.0.0', '2.0.0')).toBe(true);
    expect(isNewer('1.0.0', '1.1.0')).toBe(true);
    expect(isNewer('1.0.0', '1.0.1')).toBe(true);
  });

  it('is false for equal or older releases', () => {
    expect(isNewer('1.2.3', '1.2.3')).toBe(false);
    expect(isNewer('2.0.0', '1.9.9')).toBe(false);
    expect(isNewer('1.2.0', '1.1.9')).toBe(false);
  });

  it('orders pre-releases below their final release', () => {
    expect(isNewer('2.0.0-beta.1', '2.0.0-beta.2')).toBe(true);
    expect(isNewer('2.0.0-beta.1', '2.0.0')).toBe(true);
    expect(isNewer('2.0.0', '2.0.0-beta.9')).toBe(false);
  });

  it('handles a leading v and malformed input gracefully', () => {
    expect(isNewer('v1.0.0', 'v1.0.1')).toBe(true);
    expect(isNewer('1.0.0', 'not-a-version')).toBe(false);
    expect(isNewer('broken', '1.0.0')).toBe(false);
  });
});
