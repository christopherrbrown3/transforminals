import * as THREE from 'three';
import { expect, it } from 'vitest';
import { buildWorld } from './world';
import { disposeObject } from './effects';
import { BEACH_WATER_EDGE } from './beach';

it('keeps the City falcon visible along the east approach through actual scenery geometry', () => {
  const world = buildWorld('city');
  world.group.updateMatrixWorld(true);
  const target = new THREE.Vector3(18, 1, -29);
  for (const z of [-5, -10, -15, -20, -25]) {
    const camera = new THREE.Vector3(21, 12, z + 17);
    const direction = target.clone().sub(camera);
    const ray = new THREE.Raycaster(camera, direction.clone().normalize(), 0, direction.length());
    expect(ray.intersectObject(world.group, true), `approach z=${z}`).toHaveLength(0);
  }
  disposeObject(world.group);
});

it('keeps beach rescues, wildlife, exits and the swimming shore reachable around actual colliders', () => {
  const world = buildWorld('beach');
  const clear = (x: number, z: number) =>
    Math.hypot(x, z) < 42 &&
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
  for (const [name, x, z, range] of [
    ['turtle cage approach', -7, -9, 3],
    ['west ring', -28, -30, 1],
    ['forward ring', 0, -38, 1],
    ['east ring', 28, -30, 1],
    ['Shelly', 5, 0, 1],
    ['west wildlife', -17, -2, 1],
    ['east wildlife', 17, -5, 1],
    ['Flushington arena', 0, -19, 1],
    ['shallow swimming', -22, 2, 1],
  ] as const)
    expect(
      queue.some(([px, pz]) => Math.hypot(px - x, pz - z) < range),
      name,
    ).toBe(true);
  disposeObject(world.group);
});

it('draws shallow water along the playable beach swimming boundary without covering dry land', () => {
  const world = buildWorld('beach');
  world.group.updateMatrixWorld(true);
  const surfaces = ['swimmable-bay', 'clear-shallows', 'shoreline-shallows'].map((name) =>
    world.group.getObjectByName(name)!,
  );
  for (const [x, z] of [
    [BEACH_WATER_EDGE - 1, -34],
    [BEACH_WATER_EDGE - 1, 34],
    [-30, 20],
  ]) {
    const ray = new THREE.Raycaster(new THREE.Vector3(x, 5, z), new THREE.Vector3(0, -1, 0));
    expect(ray.intersectObjects(surfaces).length, `water at ${x},${z}`).toBeGreaterThan(0);
  }
  const sand = new THREE.Raycaster(
    new THREE.Vector3(BEACH_WATER_EDGE + 1, 5, 0),
    new THREE.Vector3(0, -1, 0),
  );
  expect(sand.intersectObjects(surfaces)).toHaveLength(0);
  disposeObject(world.group);
});
