import * as THREE from 'three';
import { expect, it } from 'vitest';
import { CREATURES } from './data';
import { createCreature, fitCagedCreature } from './creatures';
import { disposeObject } from './effects';

it('fits every required creature inside the bars and below the cage roof', () => {
  for (const creature of CREATURES) {
    const animal = createCreature(creature.id);
    fitCagedCreature(animal);
    const bounds = new THREE.Box3().setFromObject(animal);
    expect(bounds.min.y, creature.id).toBeGreaterThanOrEqual(0.1999);
    expect(bounds.max.y, creature.id).toBeLessThanOrEqual(1.2501);
    expect(
      Math.max(Math.abs(bounds.min.x), Math.abs(bounds.max.x)),
      creature.id,
    ).toBeLessThanOrEqual(1.3001);
    expect(
      Math.max(Math.abs(bounds.min.z), Math.abs(bounds.max.z)),
      creature.id,
    ).toBeLessThanOrEqual(1.3001);
    disposeObject(animal);
  }
});
