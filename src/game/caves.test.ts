import { describe, expect, it } from 'vitest';
import { CAVE_LAYOUT, buildCaveFloorplan, isCaveWalkable, nearestCaveWalkable } from './caves';
import { buildWorld } from './world';
import { disposeObject } from './effects';

describe('connected cave traversal', () => {
  it('connects every chamber, NPC, secret and exit around the actual ground colliders', () => {
    const world = buildWorld('underground');
    const clear = (x: number, z: number) =>
      isCaveWalkable(x, z) &&
      world.obstacles.every((o) => Math.hypot(x - o.x, z - o.z) >= o.radius + 0.4) &&
      !(Math.abs(x + 7) < 2.25 && Math.abs(z + 9) < 2.25);
    const queue = [[0, 5]];
    const visited = new Set(['0,5']);
    for (let i = 0; i < queue.length; i++) {
      const [x, z] = queue[i];
      for (const [dx, dz] of [
        [0.5, 0],
        [-0.5, 0],
        [0, 0.5],
        [0, -0.5],
      ]) {
        const nx = x + dx,
          nz = z + dz,
          key = `${nx},${nz}`;
        if (!visited.has(key) && clear(nx, nz)) {
          visited.add(key);
          queue.push([nx, nz]);
        }
      }
    }
    for (const target of [
      ...CAVE_LAYOUT.rooms,
      { id: 'npc-west', x: -17, z: -2 },
      { id: 'npc-east', x: 17, z: -5 },
      { id: 'npc-entry', x: 5, z: 0 },
    ]) {
      expect(
        queue.some(
          ([x, z]) => Math.hypot(x - target.x, z - target.z) < (target.id === 'bat' ? 3 : 1),
        ),
        target.id,
      ).toBe(true);
    }
    expect(visited.has('-10,20')).toBe(false);
    disposeObject(world.group);
  });

  it('relocates old positions to clear floor and retains already safe locations', () => {
    const { wallTiles } = buildCaveFloorplan();
    for (const old of [
      { x: 0, z: 5 },
      { x: -10, z: 20 },
      { x: 38, z: 38 },
      wallTiles[0],
      { x: NaN, z: Infinity },
    ]) {
      const point = nearestCaveWalkable(old.x, old.z);
      expect(isCaveWalkable(point.x, point.z, 0.4)).toBe(true);
      expect(
        wallTiles.every(
          (wall) => Math.hypot(point.x - wall.x, point.z - wall.z) >= wall.radius + 0.4,
        ),
      ).toBe(true);
    }
    expect(nearestCaveWalkable(0, 5)).toEqual({ x: 0, z: 5 });
  });
});
