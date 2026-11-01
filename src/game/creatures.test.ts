import { afterAll, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { BOSSES, CREATURES } from './data';
import { disposeObject } from './effects';
import { animateCreature, createBoss, createCreature, fitCagedCreature } from './creatures';

const built: THREE.Group[] = [];
const triangleBudget = 20_000;

function geometryStats(model: THREE.Group) {
  let triangles = 0;
  const errors: string[] = [];
  model.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    const position = node.geometry.getAttribute('position');
    if (!position || position.count < 3) {
      errors.push(`${node.name || 'mesh'} has no usable position data`);
      return;
    }
    const index = node.geometry.getIndex();
    const count = index?.count ?? position.count;
    if (count % 3 !== 0) errors.push(`${node.name || 'mesh'} has an incomplete triangle`);
    triangles += count / 3;
    for (let i = 0; i < position.count; i++)
      if (
        !Number.isFinite(position.getX(i)) ||
        !Number.isFinite(position.getY(i)) ||
        !Number.isFinite(position.getZ(i))
      ) {
        errors.push(`${node.name || 'mesh'} has a non-finite vertex`);
        break;
      }
    node.geometry.computeBoundingBox();
    const size = node.geometry.boundingBox!.getSize(new THREE.Vector3());
    if (size.x <= 1e-6 || size.y <= 1e-6 || size.z <= 1e-6)
      errors.push(`${node.name || 'mesh'} has degenerate bounds`);
  });
  return { triangles, errors };
}

function finiteBounds(model: THREE.Group) {
  model.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  return [...bounds.min.toArray(), ...bounds.max.toArray(), ...size.toArray()].every(
    Number.isFinite,
  )
    ? size
    : null;
}

describe.each(CREATURES)('$name model', (creature) => {
  it('keeps its original toy geometry valid and bounded through idle and moving poses', () => {
    const model = createCreature(creature.id);
    built.push(model);

    const features = model.userData.features as string[] | undefined;
    expect(
      features?.length,
      'each species should expose its modeled silhouette cues',
    ).toBeGreaterThan(0);
    expect(model.name).toBe(`creature:${creature.id}`);

    const geometry = geometryStats(model);
    expect(geometry.errors, 'geometry positions and primitive bounds should remain usable').toEqual(
      [],
    );
    expect(geometry.triangles).toBeGreaterThan(0);
    expect(geometry.triangles, 'keep the model light enough for a mobile scene').toBeLessThan(
      triangleBudget,
    );

    for (const [time, moving] of [
      [0, false],
      [0.37, true],
      [1.21, true],
      [3.8, false],
      [6.4, true],
    ] as const) {
      animateCreature(model, time, moving);
      const size = finiteBounds(model);
      expect(size, `pose at t=${time} must produce finite bounds`).not.toBeNull();
      expect(size!.x).toBeGreaterThan(0.05);
      expect(size!.y).toBeGreaterThan(0.05);
      expect(size!.z).toBeGreaterThan(0.05);
      expect(Math.max(size!.x, size!.y, size!.z)).toBeLessThan(12);
    }
  });

  it('fits the idle animation inside its rescue cage with breathing room', () => {
    const model = createCreature(creature.id);
    built.push(model);
    animateCreature(model, 0, false);
    fitCagedCreature(model);

    for (const time of [0, 0.37, 1.21, 3.8, 6.4]) {
      animateCreature(model, time, false);
      model.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(model);
      expect(bounds.min.y, `cage floor at t=${time}`).toBeGreaterThanOrEqual(0.19);
      expect(bounds.max.y, `cage roof at t=${time}`).toBeLessThanOrEqual(1.3);
      expect(Math.abs(bounds.min.x), `left side at t=${time}`).toBeLessThanOrEqual(1.35);
      expect(Math.abs(bounds.max.x), `right side at t=${time}`).toBeLessThanOrEqual(1.35);
      expect(Math.abs(bounds.min.z), `front side at t=${time}`).toBeLessThanOrEqual(1.35);
      expect(Math.abs(bounds.max.z), `back side at t=${time}`).toBeLessThanOrEqual(1.35);
    }
  });
});

describe.each(BOSSES)('$name boss sculpture', (boss) => {
  it('keeps detailed geometry within the mobile actor budget', () => {
    const model = createBoss(boss.id);
    built.push(model);
    const geometry = geometryStats(model);
    expect(geometry.errors).toEqual([]);
    expect(geometry.triangles).toBeLessThan(10_000);
    let meshes = 0;
    model.traverse((node) => {
      if (node instanceof THREE.Mesh) meshes++;
    });
    expect(
      meshes,
      'batch static details while retaining the expressive joints',
    ).toBeLessThanOrEqual(12);

    for (const time of [0, 0.37, 1.21, 3.8, 6.4]) {
      animateCreature(model, time, false);
      const size = finiteBounds(model);
      expect(size).not.toBeNull();
      expect(Math.max(size!.x, size!.y, size!.z)).toBeLessThan(5.5);
      expect(new THREE.Box3().setFromObject(model).min.y).toBeGreaterThan(-0.02);
    }
  });

  it('lands head stomps on its own head or hat, with no golden cap on top', () => {
    const model = createBoss(boss.id);
    built.push(model);
    const height = Number(model.userData.headHeight);
    // The old cap sat at 2.49 (3.39 for the final lizard); the head itself is a little lower.
    expect(height).toBeLessThan(boss.id === 'demon-lizard' ? 3.39 : 2.49);
    expect(height).toBeGreaterThan(boss.id === 'demon-lizard' ? 2.9 : 2.2);
    const ray = new THREE.Raycaster();
    for (const time of [0, 0.37, 1.21, 3.8, 6.4]) {
      animateCreature(model, time, false);
      model.updateMatrixWorld(true);
      ray.set(new THREE.Vector3(0, height + 2, 0), new THREE.Vector3(0, -1, 0));
      const landing = ray.intersectObject(model, true)[0];
      expect(landing, 'the stomp lands on the model itself').toBeDefined();
      expect(Math.abs(landing.point.y - height)).toBeLessThan(0.03);
    }
  });

  it('becomes a playable form that stands on the ground, faces ahead and walks', () => {
    const model = createCreature(boss.id);
    built.push(model);
    expect(model.name).toBe(`creature:${boss.id}`);
    for (const time of [0, 0.21, 0.8]) {
      animateCreature(model, time, true);
      const size = finiteBounds(model);
      expect(size).not.toBeNull();
      const bounds = new THREE.Box3().setFromObject(model);
      expect(bounds.min.y).toBeGreaterThan(-0.05);
      expect(bounds.min.y).toBeLessThan(0.1);
      // A little taller than Calvin; giant forms are drawn at double scale by the game.
      expect(size!.y).toBeGreaterThan(1.3);
      expect(size!.y).toBeLessThan(2.8);
    }
    // The walk swings the legs, unlike the boss's standing idle.
    const legs = (model.userData.bossRig as { legs: THREE.Object3D[] }).legs;
    animateCreature(model, 0.15, true);
    expect(Math.abs(legs[0].rotation.x)).toBeGreaterThan(0.1);
  });
});

afterAll(() => built.forEach(disposeObject));
