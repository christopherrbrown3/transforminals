import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { ATMOSPHERES, buildAtmosphere } from './atmosphere';
import { BIOMES } from './data';
import { disposeObject } from './effects';

const ids = BIOMES.map((b) => b.id);

describe('region atmosphere', () => {
  it('styles every region from data', () => {
    expect(Object.keys(ATMOSPHERES).sort()).toEqual([...ids].sort());
  });

  it.each(ids)('keeps %s silhouettes and clouds beyond the playable disc', (id) => {
    const atmosphere = buildAtmosphere(id);
    const matrix = new THREE.Matrix4(),
      position = new THREE.Vector3();
    let instances = 0;
    atmosphere.group.traverse((o) => {
      if (!(o instanceof THREE.InstancedMesh) || o.name === 'light-shafts') return;
      for (let i = 0; i < o.count; i++) {
        o.getMatrixAt(i, matrix);
        position.setFromMatrixPosition(matrix);
        expect(Math.hypot(position.x, position.z), `${o.name} ${i}`).toBeGreaterThan(46);
        expect(Number.isFinite(position.y)).toBe(true);
        instances++;
      }
    });
    expect(instances).toBeGreaterThan(10);
    const lowland = atmosphere.group.getObjectByName('lowland');
    if (lowland) expect(lowland.position.y).toBeLessThan(0);
    disposeObject(atmosphere.group);
  });

  it('follows the camera with the sky and keeps motes around the view', () => {
    const atmosphere = buildAtmosphere('winter');
    const camera = new THREE.PerspectiveCamera();
    camera.position.set(20, 12, 30);
    camera.lookAt(20, 1, 10);
    camera.updateMatrixWorld();
    atmosphere.tick(37.5, camera, false);
    expect(atmosphere.group.getObjectByName('sky')!.position.toArray()).toEqual([20, 12, 30]);
    const motes = atmosphere.group.getObjectByName('ambient-motes') as THREE.Points;
    expect(motes.visible).toBe(true);
    const position = motes.geometry.getAttribute('position');
    // The wrap volume sits 18 units ahead of the camera on the ground plane.
    for (let i = 0; i < position.count; i++) {
      expect(Math.abs(position.getX(i) - 20)).toBeLessThanOrEqual(23);
      expect(Math.abs(position.getZ(i) - 12)).toBeLessThanOrEqual(21);
      expect(position.getY(i)).toBeGreaterThanOrEqual(-0.2);
      expect(position.getY(i)).toBeLessThanOrEqual(11);
    }
    disposeObject(atmosphere.group);
  });

  it('removes ambient particles and holds clouds still with reduced motion', () => {
    const atmosphere = buildAtmosphere('meadow');
    const camera = new THREE.PerspectiveCamera();
    camera.position.set(0, 12, 24);
    camera.lookAt(0, 1, 4);
    camera.updateMatrixWorld();
    const clouds = atmosphere.group.getObjectByName('clouds')!;
    atmosphere.tick(50, camera, true);
    expect(atmosphere.group.getObjectByName('ambient-motes')!.visible).toBe(false);
    expect(clouds.rotation.y).toBe(0);
    atmosphere.tick(50, camera, false);
    expect(clouds.rotation.y).not.toBe(0);
    disposeObject(atmosphere.group);
  });

  it('sheds clouds, light shafts and motes in lite mode and restores them afterwards', () => {
    const camera = new THREE.PerspectiveCamera();
    camera.position.set(0, 12, 24);
    camera.lookAt(0, 1, 4);
    camera.updateMatrixWorld();
    for (const id of ['meadow', 'ocean']) {
      const atmosphere = buildAtmosphere(id);
      const extras = ['clouds', 'light-shafts', 'ambient-motes']
        .map((name) => atmosphere.group.getObjectByName(name))
        .filter((o): o is THREE.Object3D => Boolean(o));
      expect(extras.length, id).toBeGreaterThanOrEqual(2);
      atmosphere.setLite(true);
      atmosphere.tick(12, camera, false);
      expect(extras.every((o) => !o.visible)).toBe(true);
      // The sky and distant scenery stay, so the region keeps its character.
      expect(atmosphere.group.getObjectByName('sky-dome')!.visible).toBe(true);
      atmosphere.setLite(false);
      atmosphere.tick(12, camera, false);
      expect(extras.every((o) => o.visible)).toBe(true);
      disposeObject(atmosphere.group);
    }
  });

  it('releases every geometry, material and generated texture', () => {
    const atmosphere = buildAtmosphere('rifts');
    const disposed = vi.fn();
    const resources = new Set<THREE.EventDispatcher<{ dispose: object }>>();
    atmosphere.group.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.geometry) return;
      resources.add(mesh.geometry);
      const material = mesh.material as THREE.PointsMaterial;
      resources.add(material);
      if (material.map) resources.add(material.map);
    });
    resources.forEach((r) => r.addEventListener('dispose', disposed));
    disposeObject(atmosphere.group);
    // Rift: dome, stars and motes (each with a sprite), plus the batched silhouettes.
    expect(resources.size).toBeGreaterThan(8);
    expect(disposed).toHaveBeenCalledTimes(resources.size);
  });
});
