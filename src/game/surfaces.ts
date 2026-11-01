import type { WorldLedge, WorldObstacle, WorldSurface } from './world';

/** The player's collision radius against scenery. */
export const BODY = 0.4;
/** Height the player can sink below a top in one frame and still be standing on it. */
const SETTLE = 0.05;

interface Point {
  x: number;
  z: number;
}

/** The height an obstacle can be stood on; its sides are solid below it. */
export const standingHeight = (o: WorldObstacle) => o.top?.y ?? o.height ?? 4;

function within(center: Point, shape: Omit<WorldSurface, 'y'>, p: Point, pad: number) {
  if (shape.half)
    return (
      Math.abs(p.x - center.x) < shape.half[0] + pad &&
      Math.abs(p.z - center.z) < shape.half[1] + pad
    );
  return Math.hypot(p.x - center.x, p.z - center.z) < (shape.radius ?? 0) + pad;
}

/**
 * True while any part of the player's body is over the obstacle's top. The top always covers
 * the collision footprint, so stepping off an edge never lands inside a solid side.
 */
export function overTop(o: WorldObstacle, p: Point) {
  const shape = o.top?.radius || o.top?.half ? o.top : o;
  return within(o, shape, p, BODY);
}

/** Ledges have no sides, so the player's center must be over them. */
export const overLedge = (l: WorldLedge, p: Point) => within(l, l, p, 0);

/**
 * The highest surface under the player that is not above `fromY`: a scenery top, a ledge,
 * or the ground at 0. Only surfaces already below the feet count, so jumps pass up through
 * canopies and ledges and land on them on the way down.
 */
export function floorBelow(
  world: { obstacles: readonly WorldObstacle[]; ledges: readonly WorldLedge[] },
  p: Point,
  fromY: number,
) {
  let floor = 0;
  for (const o of world.obstacles) {
    const top = standingHeight(o);
    if (top > floor && top <= fromY + SETTLE && overTop(o, p)) floor = top;
  }
  for (const l of world.ledges)
    if (l.y > floor && l.y <= fromY + SETTLE && overLedge(l, p)) floor = l.y;
  return floor;
}

/** Moves the player out of every obstacle side they are below the top of. */
export function pushOut(obstacles: readonly WorldObstacle[], p: Point & { y: number }) {
  for (const o of obstacles) {
    if (p.y >= standingHeight(o)) continue;
    const dx = p.x - o.x,
      dz = p.z - o.z;
    if (o.half) {
      const ex = o.half[0] + BODY,
        ez = o.half[1] + BODY;
      if (Math.abs(dx) >= ex || Math.abs(dz) >= ez) continue;
      // Leave through the nearer side.
      if (ex - Math.abs(dx) < ez - Math.abs(dz)) p.x = o.x + (dx < 0 ? -ex : ex);
      else p.z = o.z + (dz < 0 ? -ez : ez);
      continue;
    }
    const distance = Math.hypot(dx, dz);
    const min = o.radius + BODY;
    if (distance >= min) continue;
    p.x = o.x + (distance ? dx / distance : 1) * min;
    p.z = o.z + (distance ? dz / distance : 0) * min;
  }
}
