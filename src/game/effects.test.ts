import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { disposeObject, Effects } from './effects';
import { POWERS } from './powers';

describe('scene resource cleanup', () => {
  it.each(['expire', 'clear'] as const)('releases portal rings on %s exactly once', (cleanup) => {
    const scene = new THREE.Scene();
    const effects = new Effects(scene);
    effects.portal(new THREE.Vector3(), '#ffd36d');
    const group = scene.children[0] as THREE.Group;
    const geometry = (group.children[0] as THREE.Mesh).geometry;
    const disposed = vi.fn();
    geometry.addEventListener('dispose', disposed);
    expect(effects.portalActive).toBe(true);
    if (cleanup === 'expire') effects.tick(1);
    else effects.clear();
    effects.clear();
    effects.tick(1);
    expect(effects.portalActive).toBe(false);
    expect(scene.children).toHaveLength(0);
    expect(disposed).toHaveBeenCalledTimes(1);
  });

  it('releases instance buffers and deduplicates shared geometry, material, and texture disposal', () => {
    const texture = new THREE.Texture();
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const instances = new THREE.InstancedMesh(geometry, material, 3);
    instances.setColorAt(0, new THREE.Color(0xffd36d));
    const nested = new THREE.Group();
    nested.add(instances, new THREE.Mesh(geometry, material));
    const root = new THREE.Group();
    root.add(nested);
    const onInstanceDispose = vi.fn();
    const onGeometryDispose = vi.fn();
    const onMaterialDispose = vi.fn();
    const onTextureDispose = vi.fn();
    instances.addEventListener('dispose', onInstanceDispose);
    geometry.addEventListener('dispose', onGeometryDispose);
    material.addEventListener('dispose', onMaterialDispose);
    texture.addEventListener('dispose', onTextureDispose);

    disposeObject(root);

    expect(onInstanceDispose).toHaveBeenCalledTimes(1);
    expect(onGeometryDispose).toHaveBeenCalledTimes(1);
    expect(onMaterialDispose).toHaveBeenCalledTimes(1);
    expect(onTextureDispose).toHaveBeenCalledTimes(1);
  });

  it.each(['expire', 'clear'] as const)(
    'releases burst instance buffers on %s exactly once',
    (cleanup) => {
      const scene = new THREE.Scene();
      const effects = new Effects(scene);
      effects.burst(new THREE.Vector3(), 0xffd36d, 4);
      const mesh = scene.children[0] as THREE.InstancedMesh;
      const onInstanceDispose = vi.fn();
      const onGeometryDispose = vi.fn();
      const onMaterialDispose = vi.fn();
      mesh.addEventListener('dispose', onInstanceDispose);
      mesh.geometry.addEventListener('dispose', onGeometryDispose);
      (mesh.material as THREE.Material).addEventListener('dispose', onMaterialDispose);

      if (cleanup === 'expire') effects.tick(2.3);
      else effects.clear();
      effects.clear();
      effects.tick(3);

      expect(scene.children).toHaveLength(0);
      expect(onInstanceDispose).toHaveBeenCalledTimes(1);
      expect(onGeometryDispose).toHaveBeenCalledTimes(1);
      expect(onMaterialDispose).toHaveBeenCalledTimes(1);
    },
  );

  it.each(['expire', 'clear'] as const)(
    'releases every power look, comet trail and space twinkle on %s',
    (cleanup) => {
      const scene = new THREE.Scene();
      const effects = new Effects(scene);
      const rider = new THREE.Object3D();
      for (const spec of Object.values(POWERS))
        effects.power(spec, new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, -1), 1);
      effects.trail(new THREE.Vector3(), [0xffd476], 'leaf');
      effects.comet(rider, 1.8);
      effects.twinkle(new THREE.Vector3(0, 4, -60));
      const resources = new Set<THREE.BufferGeometry | THREE.Material | THREE.Texture>();
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.geometry) resources.add(mesh.geometry);
        const material = mesh.material as THREE.SpriteMaterial | undefined;
        if (material) resources.add(material);
        if (material?.map) resources.add(material.map);
      });
      expect(scene.children.length).toBeGreaterThan(Object.keys(POWERS).length);
      const released = new Set<unknown>();
      resources.forEach((r) => r.addEventListener('dispose', () => released.add(r)));
      if (cleanup === 'expire') for (let i = 0; i < 30; i++) effects.tick(0.1);
      else effects.clear();
      expect(scene.children).toHaveLength(0);
      expect(effects.active).toBe(0);
      expect(released.size).toBe(resources.size);
    },
  );
});
