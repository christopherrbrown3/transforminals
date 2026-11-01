import { describe, expect, it } from 'vitest';
import { BIOMES } from './data';
import { disposeObject } from './effects';
import { BODY, floorBelow, pushOut, standingHeight } from './surfaces';
import { buildWorld, type BuiltWorld, type WorldObstacle } from './world';

const building: WorldObstacle = { x: 0, z: 0, radius: 4.1, height: 8, half: [2.85, 3] };
const tree: WorldObstacle = {
  x: 10,
  z: 0,
  radius: 0.5,
  height: 4.4,
  top: { y: 3.65, radius: 1.4 },
};
const scene = {
  obstacles: [building, tree],
  ledges: [{ x: 20, z: 0, y: 5, half: [2, 0.5] as [number, number] }],
};

/** The game's vertical step: gravity, then landing on whatever is underfoot. */
function step(world: Pick<BuiltWorld, 'obstacles' | 'ledges'>, p: Player, dt = 1 / 60, g = 18) {
  pushOut(world.obstacles, p);
  const previousY = p.y;
  p.vy -= g * dt;
  p.y += p.vy * dt;
  const floor = floorBelow(world, p, previousY);
  if (p.y < floor) {
    p.y = floor;
    p.vy = 0;
  }
}
type Player = { x: number; y: number; z: number; vy: number };

describe('standing on scenery', () => {
  it('finds the roof, canopy or ledge under the player, and the ground beside them', () => {
    expect(floorBelow(scene, { x: 1, z: 2 }, 12)).toBe(8);
    expect(floorBelow(scene, { x: 2.85 + BODY - 0.05, z: 0 }, 12)).toBe(8);
    expect(floorBelow(scene, { x: 2.85 + BODY + 0.05, z: 0 }, 12)).toBe(0);
    expect(floorBelow(scene, { x: 11.2, z: 0.5 }, 6)).toBe(3.65);
    expect(floorBelow(scene, { x: 21.5, z: 0 }, 9)).toBe(5);
    // Ledges hold only when the player's middle is over them.
    expect(floorBelow(scene, { x: 22.2, z: 0 }, 9)).toBe(0);
  });

  it('lets jumps pass up through tops, which only hold from above', () => {
    expect(floorBelow(scene, { x: 1, z: 2 }, 7)).toBe(0);
    expect(floorBelow(scene, { x: 11, z: 0 }, 3)).toBe(0);
    expect(floorBelow(scene, { x: 20, z: 0 }, 4.9)).toBe(0);
  });

  it('blocks the sides below the top, and leaves through the nearer side of a box', () => {
    const walker = { x: 2.9, y: 0, z: 1 };
    pushOut(scene.obstacles, walker);
    expect(walker).toEqual({ x: 2.85 + BODY, y: 0, z: 1 });
    const trunk = { x: 10.5, y: 2, z: 0 };
    pushOut(scene.obstacles, trunk);
    expect(trunk.x).toBeCloseTo(10.9);
    // On top, nothing pushes.
    const roof = { x: 1, y: 8, z: 1 };
    pushOut(scene.obstacles, roof);
    expect(roof).toEqual({ x: 1, y: 8, z: 1 });
    expect(standingHeight(tree)).toBe(3.65);
  });

  it('keeps a falling player on the roof and canopy they land on', () => {
    for (const [x, z, top] of [
      [1.5, -2.5, 8],
      [11, 0.7, 3.65],
      [20.5, 0.2, 5],
    ]) {
      const p = { x, y: 15, z, vy: 0 };
      for (let i = 0; i < 300; i++) step(scene, p);
      expect(p, `landing at ${x},${z}`).toEqual({ x, y: top, z, vy: 0 });
    }
  });

  it('walks off a roof edge and drops beside the building without a sideways jolt', () => {
    const p = { x: 0, y: 8, z: 0, vy: 0 };
    let before = p.x;
    for (let i = 0; i < 60; i++) {
      p.x += 0.1;
      step(scene, p);
      expect(p.x - before, 'no push-out jump at the edge').toBeCloseTo(0.1, 5);
      before = p.x;
    }
    for (let i = 0; i < 120; i++) step(scene, p);
    expect(p).toEqual({ x: before, y: 0, z: 0, vy: 0 });
  });
});

describe.each(BIOMES)('$name scenery', ({ id }) => {
  const world = buildWorld(id);
  disposeObject(world.group);

  it('gives every solid side a top at least as wide, so stepping off never pops sideways', () => {
    // Tops and sides both grow by the body radius, so covering the footprint is enough.
    for (const o of world.obstacles) {
      const where = `${id} obstacle at ${o.x},${o.z}`;
      const top = o.top?.radius || o.top?.half ? o.top! : o;
      if (o.half) expect(top, `${where} keeps its box footprint as its top`).toBe(o);
      else if (top.half) expect(Math.min(...top.half), where).toBeGreaterThanOrEqual(o.radius);
      else expect(top.radius, where).toBeGreaterThanOrEqual(o.radius);
    }
  });

  it('keeps every top and ledge at a sensible height inside the play area', () => {
    for (const o of world.obstacles) {
      expect(standingHeight(o)).toBeGreaterThan(0);
      expect(standingHeight(o)).toBeLessThanOrEqual((o.height ?? 4) + 1e-9);
    }
    for (const l of world.ledges) {
      expect(l.y).toBeGreaterThan(0.5);
      expect(l.y).toBeLessThan(12);
      expect(Math.hypot(l.x, l.z)).toBeLessThan(42);
    }
  });
});
