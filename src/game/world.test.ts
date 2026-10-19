import * as THREE from 'three';
import { expect, it } from 'vitest';
import { buildWorld } from './world';
import { disposeObject } from './effects';

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
