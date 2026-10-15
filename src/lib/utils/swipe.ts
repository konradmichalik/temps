/** A drag of this share of the card width turns the page. */
const TURN_SHARE = 0.15;

/**
 * Which screen a mouse drag ends on: the next one when dragged left past the
 * threshold, the previous one when dragged right, otherwise the same. Never
 * wraps around, unlike the keyboard shortcut.
 */
export function dragTarget(
  from: number,
  dx: number,
  width: number,
  count: number,
): number {
  const turned =
    Math.abs(dx) >= width * TURN_SHARE ? (dx < 0 ? from + 1 : from - 1) : from;
  return Math.min(Math.max(turned, 0), count - 1);
}
