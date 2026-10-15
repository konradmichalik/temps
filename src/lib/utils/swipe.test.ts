import { describe, expect, it } from 'vitest';
import { dragTarget } from './swipe';

describe('dragTarget (mouse swipe between screens)', () => {
  it('stays on the screen for a short drag', () => {
    expect(dragTarget(1, -40, 340, 3)).toBe(1);
    expect(dragTarget(1, 40, 340, 3)).toBe(1);
  });

  it('moves on when dragged left past the threshold, back when dragged right', () => {
    expect(dragTarget(1, -80, 340, 3)).toBe(2);
    expect(dragTarget(1, 80, 340, 3)).toBe(0);
  });

  it('never leaves the first or last screen', () => {
    expect(dragTarget(0, 200, 340, 3)).toBe(0);
    expect(dragTarget(2, -200, 340, 3)).toBe(2);
  });

  it('scales the threshold with the card width', () => {
    expect(dragTarget(0, -60, 340, 3)).toBe(1);
    expect(dragTarget(0, -60, 800, 3)).toBe(0);
  });
});
